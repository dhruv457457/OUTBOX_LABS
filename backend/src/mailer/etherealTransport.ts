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

export interface EmailAttachment {
  filename: string;
  contentType: string;
  content: string; // base64
}

export async function sendEmail(opts: {
  from: string;
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}) {
  const info = await transporter.sendMail({
    ...opts,
    attachments: opts.attachments?.map((a) => ({
      filename: a.filename,
      contentType: a.contentType,
      content: Buffer.from(a.content, "base64"),
    })),
  });
  return nodemailer.getTestMessageUrl(info); // Ethereal preview link, handy for the demo video
}
