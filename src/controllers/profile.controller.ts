import { Request, Response } from 'express';
import { db } from '../config/database';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// Get Profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const { password, otp, otpExpiresAt, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update Profile (Name & Phone)
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { fullName, phone } = req.body;

    await db.update(users)
      .set({ fullName, phone })
      .where(eq(users.id, userId));

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// Change Password
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;

    // 1. Get User
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // 2. CHECK: If user logged in with Google, they have no password
    if (!user.password) {
        return res.status(400).json({ 
            success: false, 
            message: 'You are signed in via Google. You cannot change your password.' 
        });
    }

    // 3. Verify Old Password
    // TypeScript now knows user.password is a string here
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    // 4. Hash New Password & Save
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};
