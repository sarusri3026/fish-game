const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

// Verify email configuration
const verifyEmailConnection = async () => {
    try {
        await transporter.verify();
        console.log('Email service connected successfully!');
        return true;
    } catch (error) {
        console.error('Email service connection failed:', error.message);
        return false;
    }
};

// Send email
const sendEmail = async ({ to, subject, html }) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
            throw new Error('Email credentials are not configured.');
        }

        const mailOptions = {
            from: `"Fish Game" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        };

        const result = await transporter.sendMail(mailOptions);

        console.log('Email sent successfully:', result.messageId);

        return {
            success: true,
            messageId: result.messageId
        };

    } catch (error) {
        console.error('Email sending failed:', error.message);
        throw error;
    }
};

module.exports = {
    sendEmail,
    verifyEmailConnection
};
