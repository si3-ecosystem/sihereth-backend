const nodemailer = require('nodemailer');

// Create a transporter object
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.example.com',
  port: process.env.MAIL_PORT || 587,
  secure: process.env.MAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER || 'user@example.com',
    pass: process.env.MAIL_PASSWORD || 'password',
  },
});

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body (optional)
 * @returns {Promise} - Resolves with info about the sent email
 */
const sendMail = async (options) => {
  try {
    const mailOptions = {
      from: process.env.MAIL_FROM || '"Your App" <noreply@example.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = {
  transporter,
  sendMail,
};
