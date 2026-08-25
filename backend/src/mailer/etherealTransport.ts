import nodemailer from "nodemailer";
import { env } from "../config/env.js";

export const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false,
  auth: {
    user: env.ETHEREAL_USER,
    pass: env.ETHEREAL_PASS,
  },
});

export async function sendEmail(opts: {
  from: string;
  to: string;
  subject: string;
  html: string;
}) {
  const info = await transporter.sendMail(opts);
  return nodemailer.getTestMessageUrl(info); // Ethereal preview link, handy for the demo video
}
