import { Request, Response } from 'express';
import { db } from '../config/database';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendOtpEmail } from '../services/emailService';
import { OAuth2Client } from 'google-auth-library'; // <--- NEW IMPORT

// Make sure to add GOOGLE_CLIENT_ID to your backend .env file!
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register User
export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, phone } = req.body;

    const [existingUser] = await db.select().from(users).where(eq(users.email, email));
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.insert(users).values({
      fullName,
      email,
      password: hashedPassword,
      phone
    });

    const [newUser] = await db.select().from(users).where(eq(users.email, email));

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || 'secret_key_change_me',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: { id: newUser.id, name: newUser.fullName, email: newUser.email, phone: newUser.phone }
    });

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Login User
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Google users might not have a password
    if (!user.password) {
        return res.status(401).json({ success: false, message: 'Please login with Google' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret_key_change_me', 
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.fullName, email: user.email, phone: user.phone }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Forgot Password
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

    await db.update(users).set({ otp, otpExpiresAt: expiresAt }).where(eq(users.id, user.id));
    await sendOtpEmail(email, otp);

    res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (!user || user.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (new Date() > (user.otpExpiresAt as Date)) return res.status(400).json({ success: false, message: 'OTP expired' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ password: hashedPassword, otp: null, otpExpiresAt: null }).where(eq(users.id, user.id));

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// --- NEW: GOOGLE AUTH CONTROLLER ---
export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    
    if (!payload || !payload.email) {
        return res.status(400).json({ success: false, message: 'Invalid Google Token' });
    }

    const { email, name, sub: googleId } = payload;

    let [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
        // Register new user
        await db.insert(users).values({
            fullName: name || 'Google User',
            email: email,
            googleId: googleId,
            password: null, // No password
            role: 'user'
        });
        [user] = await db.select().from(users).where(eq(users.email, email));
    } else {
        // Link Google ID if missing
        if (!user.googleId) {
            await db.update(users).set({ googleId }).where(eq(users.id, user.id));
        }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret_key_change_me', 
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.fullName, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ success: false, message: 'Google Authentication Failed' });
  }
};
