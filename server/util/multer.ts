const multer = require("multer");
import type { Request } from 'express';
import type { FileFilterCallback, StorageEngine } from 'multer';
const path = require("path");
const crypto = require("crypto");

const storageTypes: StorageEngine = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, path.resolve(__dirname, "..", "..", "tmp", "uploads"));
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename?: string) => void) => {
    crypto.randomBytes(16, (err: Error | null, hash: Buffer) => {
      if (err) return cb(err);

      const uploadFile = file as Express.Multer.File & { key: string };
      uploadFile.key = `${hash.toString("hex")}-${file.originalname}`;

      cb(null, uploadFile.key);
    });
  }
});

module.exports = {
  dest: path.resolve(__dirname, "..", "..", "tmp", "uploads"),
  storage: storageTypes,
  limits: {
    fileSize: 15 * 1024 * 1024
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedMimes = [
      "image/jpeg",
      "image/pjpeg",
      "image/png",
      "image/gif"
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type."));
    }
  }
};
