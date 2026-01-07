import { Request, Response } from 'express';
import { db } from '../config/database'; // Adjust path if needed
import { users } from '../../db/schema'; // Adjust path if needed
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendOtpEmail } from '../services/emailService';

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    // 1. Find user
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 2. Check Password using Bcrypt (Matches the seed file hashing)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Generate Token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'secret_key_change_me', 
      { expiresIn: '1d' }
    );

    return res.json({ token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Save to DB
    await db.update(users)
      .set({ otp, otpExpiresAt: expiresAt })
      .where(eq(users.id, user.id));

    // Send Email
    await sendOtpEmail(email, otp);

    res.json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > (user.otpExpiresAt as Date)) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.update(users)
      .set({ password: hashedPassword, otp: null, otpExpiresAt: null })
      .where(eq(users.id, user.id));

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
