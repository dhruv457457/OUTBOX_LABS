import { Router } from "express";
import multer from "multer";
import { uploadAttachment } from "../services/storageService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { AuthedRequest } from "../auth/middleware.js";

export const attachmentsRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

attachmentsRouter.post(
  "/",
  upload.single("file"),
  asyncHandler<AuthedRequest>(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "no file uploaded" });
      return;
    }
    res.status(201).json(await uploadAttachment(req.file));
  }),
);
