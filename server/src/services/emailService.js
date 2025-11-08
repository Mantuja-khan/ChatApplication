import nodemailer from 'nodemailer';

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateEmailTemplate = (otp) => `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(to right, #4ade80, #3b82f6);
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: white;
          padding: 30px;
          border-radius: 0 0 10px 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .otp {
          font-size: 32px;
          font-weight: bold;
          color: #4ade80;
          text-align: center;
          letter-spacing: 8px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>WhatsApp Clone</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email</h2>
          <p>Please use the following OTP to verify your email address:</p>
          <div class="otp">${otp}</div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
  </html>
`;

export const sendOTPEmail = async (email) => {
  try {
    const otp = generateOTP();
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
       user: "mantujak@gmail.com",
        pass: "axyo delf gmbm zobb"
      }
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Verify Your Email - WhatsApp Clone',
      html: generateEmailTemplate(otp)
    });

    return { otp, error: null };
  } catch (error) {
    console.error('Error sending email:', error);
    return { otp: null, error: 'Failed to send OTP email' };
  }
};
