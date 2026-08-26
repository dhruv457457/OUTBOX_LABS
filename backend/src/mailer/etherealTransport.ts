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
  url: string;
  bytes: number;
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
    // nodemailer streams each file straight from storage, so the message body never
    // carries the bytes around.
    attachments: opts.attachments?.map((a) => ({
      filename: a.filename,
      contentType: a.contentType,
      path: a.url,
    })),
  });
  return nodemailer.getTestMessageUrl(info); // Ethereal preview link, handy for the demo video
}
