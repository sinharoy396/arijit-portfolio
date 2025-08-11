// This serverless function acts as a stub for sending notifications.
// Integrate with your preferred email or SMS provider (e.g. Resend, Twilio)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  const { message } = req.body;
  // TODO: implement your notification logic here.
  console.log('Received notification request:', message);
  return res.status(200).json({ success: true });
}