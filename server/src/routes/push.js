import express from 'express';
import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  "mailto:mantujak@gmail.com",
  "BDxMVh5tDLUsdiyT1in_AcKVDdw87HenNcaHPsmxqAmc4wj7K7vBhZArwjtyN14SlarwbECYZgkGDS2lVjfM65I",
  "SRB965ieEow8UDae50c3ZnArokbE5VnmNKS7XVdaqOA"
);

export const pushRouter = express.Router();

// Store subscriptions (in production, use a database)
const subscriptions = new Map();

// Subscribe endpoint
pushRouter.post('/subscribe', async (req, res) => {
  try {
    const { subscription, userId } = req.body;
    subscriptions.set(userId, subscription);
    res.status(201).json({ message: 'Subscription added successfully' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: 'Subscription failed' });
  }
});

// Send notification
export async function sendPushNotification(userId, title, message, url) {
  try {
    const subscription = subscriptions.get(userId);
    if (!subscription) return;

    const payload = JSON.stringify({
      title,
      message,
      url
    });

    await webpush.sendNotification(subscription, payload);
  } catch (error) {
    console.error('Push notification error:', error);
    if (error.statusCode === 410) {
      // Subscription has expired or is invalid
      subscriptions.delete(userId);
    }
  }
}