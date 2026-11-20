
const crypto = require('crypto');
const UserModel = require('../models/User');
const { sendEmail } = require('./emailService');

class OTPService {
    // Generate a secure 6-digit OTP
    generateOTP() {
        return crypto.randomInt(100000, 1000000).toString();
    }

    // Hash OTP using SHA-256
    hashOTP(otp) {
        return crypto
            .createHash('sha256')
            .update(otp)
            .digest('hex');
    }

    // Generate, save and send OTP
    async sendLoginOTP(db, user) {
        const userModel = new UserModel(db);

        const otp = this.generateOTP();
        const hashedOTP = this.hashOTP(otp);

        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await userModel.saveLoginOTP(
            user._id,
            hashedOTP,
            expiresAt
        );

        await sendEmail({
            to: user.email,
            subject: 'Fish Game - Login Verification Code',
            html: `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Fish Game · Login verification</title>
                    <style>
                        * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                        }

                        body {
                        background-color: #eef2f6;
                        font-family: 'Arial', 'Helvetica', 'Segoe UI', sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        padding: 20px;
                        margin: 0;
                        }

                        .fish-email {
                        max-width: 520px;
                        width: 100%;
                        background: #ffffff;
                        border-radius: 28px;
                        box-shadow: 0 20px 35px -8px rgba(0, 30, 60, 0.15), 0 8px 18px -6px rgba(0, 40, 80, 0.08);
                        padding: 36px 32px 40px;
                        border: 1px solid #d9e2ef;
                        transition: all 0.15s ease;
                        }

                        .fish-email {
                        font-family: 'Arial', sans-serif;
                        }

                        h2 {
                        font-size: 1.9rem;
                        font-weight: 700;
                        letter-spacing: -0.02em;
                        color: #0b2b4e;
                        margin: 0 0 12px 0;
                        padding: 0;
                        line-height: 1.2;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        }

                        h2::before {
                        content: "🐟";
                        font-size: 2rem;
                        margin-right: 6px;
                        filter: drop-shadow(0 2px 4px rgba(0,100,150,0.2));
                        }

                        .greeting {
                        font-size: 1.1rem;
                        color: #1e3b5c;
                        margin: 0 0 6px 0;
                        font-weight: 500;
                        padding: 0;
                        }

                        .code-label {
                        font-size: 1rem;
                        color: #315e7e;
                        letter-spacing: 0.2px;
                        margin: 22px 0 8px 0;
                        font-weight: 500;
                        text-transform: uppercase;
                        font-size: 0.85rem;
                        letter-spacing: 1.5px;
                        color: #2d6a9f;
                        }

                        .otp-code {
                        font-size: 3.8rem;
                        font-weight: 800;
                        letter-spacing: 10px;
                        color: #2563eb;
                        margin: 6px 0 12px 0;
                        padding: 12px 0 8px 0;
                        text-align: left;
                        line-height: 1.2;
                        background: linear-gradient(145deg, #f0f7ff, #ffffff);
                        border-radius: 20px;
                        border-left: 6px solid #2563eb;
                        padding-left: 22px;
                        font-family: 'Arial', 'Courier New', monospace;
                        word-break: break-word;
                        text-shadow: 0 2px 6px rgba(37, 99, 235, 0.12);
                        box-shadow: inset 0 1px 3px rgba(0,0,0,0.02);
                        }

                        .expiry-note {
                        font-size: 1rem;
                        color: #215273;
                        background: #e9f2fc;
                        padding: 12px 18px;
                        border-radius: 60px;
                        margin: 24px 0 20px 0;
                        display: inline-block;
                        font-weight: 500;
                        border: 1px solid #cddff2;
                        letter-spacing: 0.2px;
                        line-height: 1.4;
                        }

                        .expiry-note strong {
                        font-weight: 700;
                        color: #0e3b63;
                        }

                        .warning-message {
                        font-size: 0.95rem;
                        color: #b33e3e;
                        background: #fff4f2;
                        padding: 10px 20px;
                        border-radius: 40px;
                        display: inline-block;
                        border: 1px solid #ffd6cf;
                        font-weight: 600;
                        letter-spacing: 0.2px;
                        margin: 0 0 28px 0;
                        box-shadow: 0 2px 6px rgba(200, 60, 30, 0.05);
                        }

                        .signature {
                        font-size: 1rem;
                        color: #2b4d6b;
                        margin-top: 32px;
                        padding-top: 18px;
                        border-top: 2px dashed #bfd5eb;
                        line-height: 1.6;
                        font-weight: 500;
                        }

                        .signature strong {
                        color: #0f3b60;
                        font-weight: 700;
                        font-size: 1.05rem;
                        }

                        .fish-email {
                        position: relative;
                        overflow: hidden;
                        }

                        .fish-email::after {
                        content: "🐠 🐟 🐡";
                        position: absolute;
                        bottom: 12px;
                        right: 24px;
                        font-size: 1.8rem;
                        opacity: 0.15;
                        pointer-events: none;
                        letter-spacing: 6px;
                        transform: rotate(-2deg);
                        }

                        @media (max-width: 480px) {
                        .fish-email {
                            padding: 26px 20px 32px;
                            border-radius: 22px;
                        }

                        h2 {
                            font-size: 1.6rem;
                        }

                        .otp-code {
                            font-size: 2.8rem;
                            letter-spacing: 6px;
                            padding-left: 14px;
                            border-left-width: 5px;
                        }

                        .expiry-note {
                            font-size: 0.9rem;
                            padding: 10px 16px;
                        }

                        .fish-email::after {
                            font-size: 1.4rem;
                            bottom: 8px;
                            right: 14px;
                            opacity: 0.1;
                        }
                        }

                        .fish-email p {
                        margin: 0 0 8px 0;
                        }

                        .fish-email p:last-of-type {
                        margin-bottom: 0;
                        }

                        .expiry-note strong {
                        font-weight: 700;
                        }
                    </style>
                    </head>
                    <body>
                    <div class="fish-email">
                        <h2>Fish Game Login Verification</h2>
                        <p class="greeting">Hello <strong>${user.username}</strong>,</p>
                        <p class="code-label">Your login verification code is:</p>
                        <h1 class="otp-code">${otp}</h1>
                        <p class="expiry-note">⏳ This OTP expires in <strong>5 minutes</strong>.</p>
                        <p class="warning-message">🔒 Do not share this code with anyone.</p>
                        <div class="signature">
                        Thank you,<br>
                        <strong>Fish Game Team</strong>
                        </div>
                    </div>
                    </body>
                    </html>
      `
        });

        return {
            success: true,
            message: 'OTP sent successfully.'
        };
    }
}

module.exports = new OTPService();
