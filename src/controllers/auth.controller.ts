import { Request, Response } from 'express';
import { db } from '../config/database';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendOtpEmail } from '../services/emailService';

// Register User
export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // 1. Check if user exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, email));
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Insert User
    await db.insert(users).values({
      fullName,
      email,
      password: hashedPassword,
      phone
    });

    // 4. Fetch the newly created user to generate token
    const [newUser] = await db.select().from(users).where(eq(users.email, email));

    // 5. Generate Token
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
  const { email, password } = req.body; // Changed username to email

  try {
    // 1. Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // 2. Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // 3. Generate Token
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
