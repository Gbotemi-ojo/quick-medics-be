import { Request, Response } from 'express';
import { db } from '../config/database';
import { trainingApplications } from '../../db/schema';
// Import the working function from your service
import { sendTrainingApplicationEmail } from '../services/emailService'; 

export const submitApplication = async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, address, educationLevel, motivation } = req.body;

    // 1. Validation
    if (!fullName || !email || !phone || !motivation) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }

    // 2. Save to Database
    await db.insert(trainingApplications).values({
      fullName,
      email,
      phone,
      address,
      educationLevel,
      motivation,
    });

    // 3. Send Email (Using the verified service)
    // This will now use the connection that we know is working
    await sendTrainingApplicationEmail({
      fullName,
      email,
      phone,
      address,
      educationLevel,
      motivation
    });

    res.status(201).json({ success: true, message: 'Application submitted successfully!' });

  } catch (error) {
    console.error('Training Application Error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit application.' });
  }
};
