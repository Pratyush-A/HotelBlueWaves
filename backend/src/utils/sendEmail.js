import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Hotel Management" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP for Password Reset",
    text: `Your OTP to reset your password is: ${otp}. It is valid for 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);
};
