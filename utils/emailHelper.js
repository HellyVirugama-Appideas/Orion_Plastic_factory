const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send Email
exports.sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"${process.env.APP_NAME}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Email Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send Welcome Email
exports.sendWelcomeEmail = async (to, name) => {
  const html = `
    <h1>Welcome ${name}!</h1>
    <p>Thank you for registering with us.</p>
    <p>Your account has been created successfully.</p>
  `;
  
  return await this.sendEmail(to, 'Welcome to Our Platform', html);
};

// Send Password Reset Email
exports.sendPasswordResetEmail = async (to, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  const html = `
    <h2>Password Reset Request</h2>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;
  
  return await this.sendEmail(to, 'Password Reset Request', html);
  
};