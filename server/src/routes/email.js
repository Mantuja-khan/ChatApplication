import express from 'express';
import { sendOTPEmail } from '../services/emailService.js';

export const emailRouter = express.Router();

emailRouter.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const { otp, error } = await sendOTPEmail(email);
    
    if (error) {
      return res.status(500).json({ error });
    }
    
    res.json({ otp });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});