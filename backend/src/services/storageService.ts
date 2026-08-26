import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

if (env.CLOUDINARY_URL) cloudinary.config({ secure: true });

export interface StoredAttachment {
  filename: string;
  contentType: string;
  url: string;
  bytes: number;
}

/** Uploads a file and returns just the reference we keep on the email row.
 *  `resource_type: "auto"` lets Cloudinary handle images, PDFs and everything else. */
export async function uploadAttachment(file: {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}): Promise<StoredAttachment> {
  if (!env.CLOUDINARY_URL) throw new Error("attachments are not configured — set CLOUDINARY_URL");

  const result = await new Promise<{ secure_url: string; bytes: number }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "outbox-attachments", resource_type: "auto" }, (error, uploaded) => {
        if (error || !uploaded) reject(error ?? new Error("upload failed"));
        else resolve(uploaded as { secure_url: string; bytes: number });
      })
      .end(file.buffer);
  });

  return {
    filename: file.originalname,
    contentType: file.mimetype || "application/octet-stream",
    url: result.secure_url,
    bytes: result.bytes,
  };
}
