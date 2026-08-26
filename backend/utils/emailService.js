import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      html, // html body
    });

    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    // Don't throw error to prevent blocking main flow, just log it
    // Or throw if email is critical. For notifications, usually better to log.
    return null;
  }
};

// A plain function export (sendEmail above) can't be mocked in place by
// node:test's t.mock.method, since ESM named imports are live bindings, not
// writable object properties. Callers that need to be unit-testable with
// their email side effect stubbed out should call through this object
// instead (see backend/tests/services/authService.test.js).
export const emailServiceWrapper = { sendEmail };
