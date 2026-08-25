import { Router } from "express";
import multer from "multer";
import { extractEmails } from "../utils/csvParser.js";

export const uploadRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

uploadRouter.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "no file uploaded" });
    return;
  }
  const result = extractEmails(req.file.buffer.toString("utf-8"), req.file.originalname);
  res.json(result);
});
