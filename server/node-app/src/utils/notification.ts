import nodemailer from 'nodemailer';
import { Twilio } from 'twilio';
import { logger } from './logger';

// Email transporter configuration
let emailTransporter: nodemailer.Transporter | null = null;

const getEmailTransporter = (): nodemailer.Transporter => {
  if (!emailTransporter) {
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return emailTransporter;
};

// Twilio client configuration
let twilioClient: Twilio | null = null;

const getTwilioClient = (): Twilio => {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }
    
    twilioClient = new Twilio(accountSid, authToken);
  }
  return twilioClient;
};

/**
 * Send OTP via email
 * @param email - Recipient email address
 * @param otp - OTP code
 * @returns Promise<void>
 */
export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
  try {
    const transporter = getEmailTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'MicroMerit - Your OTP for Registration',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome to MicroMerit!</h2>
          <p>Your OTP for registration is:</p>
          <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          <p>This OTP is valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.</p>
          <p>If you didn't request this OTP, please ignore this email.</p>
        </div>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent to ${email}`);
  } catch (error) {
    logger.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

/**
 * Send OTP via SMS using Twilio
 * @param phone - Recipient phone number (E.164 format)
 * @param otp - OTP code
 * @returns Promise<void>
 */
export const sendOTPSMS = async (phone: string, otp: string): Promise<void> => {
  try {
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (!fromNumber) {
      throw new Error('Twilio phone number not configured');
    }
    
    await client.messages.create({
      body: `Your MicroMerit registration OTP is: ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`,
      from: fromNumber,
      to: phone,
    });
    
    logger.info(`OTP SMS sent to ${phone}`);
  } catch (error) {
    logger.error('Error sending OTP SMS:', error);
    throw new Error('Failed to send OTP SMS');
  }
};

/**
 * Send OTP based on verification method
 * @param method - 'email' or 'phone'
 * @param recipient - Email address or phone number
 * @param otp - OTP code
 * @returns Promise<void>
 */
export const sendOTP = async (
  method: 'email' | 'phone',
  recipient: string,
  otp: string
): Promise<void> => {
  if (method === 'email') {
    await sendOTPEmail(recipient, otp);
  } else if (method === 'phone') {
    await sendOTPSMS(recipient, otp);
  } else {
    throw new Error('Invalid verification method');
  }
};
