const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create Gmail transporter using App Password
const createTransporter = () => {
  // For development - use Gmail SMTP with App Password
  if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log('\n⚠️  Gmail credentials not found in environment variables!');
      console.log('To send real emails, please set up Gmail App Password:');
      console.log('1. Go to https://myaccount.google.com/security');
      console.log('2. Enable 2-Step Verification if not already enabled');
      console.log('3. Go to App Passwords and generate one for this app');
      console.log('4. Add to your .env file:');
      console.log('   GMAIL_USER=your-email@gmail.com');
      console.log('   GMAIL_APP_PASSWORD=your-16-digit-app-password');
      console.log('\nFor now, emails will be logged to console...\n');
      
      return null;
    }

    return nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // For production - use custom SMTP settings
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const sendVerificationEmail = async (to, verificationToken) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    // Fallback to console logging when Gmail credentials are not available
    console.log('\n📧 Email would be sent to:', to);
    console.log('📧 Verification Link:');
    console.log(`🔗 http://localhost:3000/verify-email?token=${verificationToken}`);
    console.log('\n⚡ Quick verify (development only):');
    console.log(`   GET http://localhost:4000/api/auth/dev-verify/${verificationToken}`);
    console.log('');
    return;
  }

  const verificationLink = `http://localhost:3000/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: `"Ascends" <${process.env.GMAIL_USER}>`,
    to: to,
    subject: 'Verify Your Ascends Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); border-radius: 10px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Ascends!</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">Verify Your Email Address</h2>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Thank you for signing up for Ascends! To complete your registration and start your journey with better posture, 
            please verify your email address by clicking the button below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); 
                      color: white; 
                      text-decoration: none; 
                      padding: 15px 30px; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
            This link will expire in 24 hours. If you didn't create this account, please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
          <p>© 2025 Ascends. All rights reserved.</p>
          <p>Questions? Contact us at support@ascends.me</p>
        </div>
      </div>
    `,
    text: `
      Welcome to Ascends!
      
      Please verify your email address by clicking the link below:
      ${verificationLink}
      
      This link will expire in 24 hours.
      
      If you didn't create this account, please ignore this email.
      
      Best regards,
      The Ascends Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent successfully to: ${to}`);
  } catch (error) {
    console.error('❌ Error sending verification email:', error.message);
    
    // Fallback to console logging if email fails
    console.log('\n📧 Email sending failed. Here\'s the verification link:');
    console.log(`🔗 ${verificationLink}`);
    console.log('');
    
    throw error;
  }
};

module.exports = {
  generateVerificationToken,
  sendVerificationEmail
}; 