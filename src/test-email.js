import nodemailer from "nodemailer";
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendTestEmail = async () => {
    try {
        console.log('Sending email...');
        console.log('User:', process.env.EMAIL_USER);
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to self
            subject: 'Test Email Verification',
            text: 'This is a test email to verify the email functionality is working.',
        });
        console.log('Email sent successfully!', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

sendTestEmail();
