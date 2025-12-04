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
    // TODO: Re-enable email sending when SMTP is properly configured
    // Temporarily disabled - OTP is only logged for development/testing

    logger.warn(`[DEV MODE] OTP for ${email}: ${otp} (valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes)`);
    logger.info(`OTP email would be sent to ${email} (currently disabled)`);

    // TEMPORARILY COMMENTED OUT - Uncomment when ready to send actual emails

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
    logger.error('Error in sendOTPEmail:', error);
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
    // TODO: Re-enable Twilio SMS when ready for production
    // Temporarily disabled - OTP is only logged for development/testing

    logger.warn(`[DEV MODE] OTP for ${phone}: ${otp} (valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes)`);
    logger.info(`OTP SMS would be sent to ${phone} (currently disabled)`);

    // TEMPORARILY COMMENTED OUT - Uncomment when ready to send actual SMS
    /*
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
    */
  } catch (error) {
    logger.error('Error in sendOTPSMS:', error);
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

/**
 * Send Credential Issued Email
 * @param email - Learner email
 * @param learnerName - Learner name
 * @param issuerName - Issuer name
 * @param credentialId - Credential ID
 * @param certificateTitle - Certificate title
 * @returns Promise<void>
 */
export const sendCredentialIssuedEmail = async (
  email: string,
  learnerName: string,
  issuerName: string,
  credentialId: string,
  certificateTitle: string
): Promise<void> => {
  try {
    const transporter = getEmailTransporter();
    const publicLink = `http://localhost:5173/credential/${credentialId}`;


    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: `MicroMerit - You've received a new credential from ${issuerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #333;">New Credential Issued!</h2>
          </div>
          
          <p>Hello <strong>${learnerName}</strong>,</p>
          
          <p>We are excited to inform you that <strong>${issuerName}</strong> has issued you a new credential:</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0; color: #2196F3;">${certificateTitle}</h3>
          </div>
          
          <p>You can view and verify your credential publicly at the following link:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${publicLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Credential</a>
          </div>
          
          <p style="font-size: 12px; color: #666; text-align: center;">
            Or copy this link: <a href="${publicLink}">${publicLink}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          
          <p style="font-size: 12px; color: #888; text-align: center;">
            This is an automated message from MicroMerit.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Credential issued email sent to ${email}`);
  } catch (error) {
    logger.error('Error in sendCredentialIssuedEmail:', error);
    // We don't throw here to avoid failing the main issuance process if email fails
    // But we log it as an error
  }
};
