import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getCollection, toObjectId } from "../db.js";
import {
  authenticateToken,
  authenticateOptional,
  getUserRole,
} from "../middleware/auth.js";
import { userMessage } from "../utils/userMessages.js";
import {
  decodeUploadFilename,
  deleteFromR2,
  ensureR2Configured,
  generateStorageKey,
  uploadBufferToR2,
} from "../utils/storage.js";

const router = express.Router();

const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /(\.(pdf|doc|docx|txt|png|jpg|jpeg|gif|zip|rar))$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(userMessage("documentFileType")));
    }
  },
});

router.get("/", authenticateOptional, async (req, res) => {
  try {
    const userRole = getUserRole(req);
    const documents = getCollection("documents");
    const filter =
      userRole === "admin"
        ? {}
        : {
            $or: [{ admin_only: { $exists: false } }, { admin_only: false }],
          };

    const docs = await documents
      .find(filter)
      .sort({ created_at: -1 })
      .toArray();
    res.json(docs.map(mapDocument));
  } catch (err) {
    res
      .status(500)
      .json({ error: userMessage("database"), details: err?.message });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const userRole = getUserRole(req);
    if (userRole !== "admin")
      return res.status(403).json({ error: userMessage("adminOnly") });

    const { title, url, description, admin_only } = req.body;
    const documents = getCollection("documents");
    const doc = {
      title,
      url,
      description: description || null,
      admin_only: admin_only ?? false,
      created_at: new Date(),
    };
    const result = await documents.insertOne(doc);
    res.json(mapDocument({ ...doc, _id: result.insertedId }));
  } catch (err) {
    res
      .status(500)
      .json({ error: userMessage("database"), details: err?.message });
  }
});

router.post(
  "/upload",
  authenticateToken,
  upload.single("document"),
  async (req, res) => {
    try {
      const userRole = getUserRole(req);
      if (userRole !== "admin")
        return res.status(403).json({ error: userMessage("adminOnly") });

      ensureR2Configured();
      if (!req.file) {
        return res.status(400).json({ error: userMessage("fileRequired") });
      }

      const { title, description, admin_only } = req.body;
      const cleanFilename = decodeUploadFilename(req.file.originalname);
      const documentTitle = title || cleanFilename;

      const storageKey = generateStorageKey({
        directory: "documents",
        originalName: cleanFilename,
      });

      const uploadResult = await uploadBufferToR2({
        key: storageKey,
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
        cacheControl: "public, max-age=31536000",
        metadata: {
          "original-name": cleanFilename,
          "uploaded-from": "documents-library",
        },
      });

      const documents = getCollection("documents");
      const doc = {
        title: documentTitle,
        url: uploadResult.url,
        description: description || null,
        admin_only: admin_only === "true" || admin_only === true || false,
        filename: cleanFilename,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        storage_key: storageKey,
        storage_bucket: process.env.R2_BUCKET_NAME || null,
        storage_provider: "cloudflare-r2",
        created_at: new Date(),
        uploaded_by: req.user?.id || null,
      };

      const result = await documents.insertOne(doc);

      res.json({
        ...mapDocument({ ...doc, _id: result.insertedId }),
        message: "File uploaded successfully",
      });
    } catch (err) {
      console.error("Upload error:", err);
      if (err?.message?.includes?.("Invalid file type")) {
        return res.status(400).json({
          error: userMessage("documentFileType"),
          details: err?.message,
        });
      }
      const status = err?.statusCode || 500;
      res.status(status).json({
        error: userMessage("fileUploadFailed"),
        details: err?.message || err?.missing,
      });
    }
  }
);

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userRole = getUserRole(req);
    if (userRole !== "admin")
      return res.status(403).json({ error: userMessage("adminOnly") });

    const { id } = req.params;
    const docId = toObjectId(id);
    if (!docId) {
      return res.status(400).json({ error: userMessage("invalidId") });
    }

    const documents = getCollection("documents");
    const doc = await documents.findOne({ _id: docId });

    if (!doc)
      return res.status(404).json({ error: userMessage("documentNotFound") });

    const deleteResult = await documents.deleteOne({ _id: docId });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ error: userMessage("documentNotFound") });
    }

    if (doc.storage_key) {
      try {
        await deleteFromR2(doc.storage_key);
      } catch (error) {
        if (error?.code === "R2_NOT_CONFIGURED") {
          console.warn("R2 not configured; skipped remote delete");
        } else {
          console.warn("Failed to delete document from R2", error);
        }
      }
    } else if (doc.url && doc.url.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), doc.url);
      fs.unlink(filePath, () => {});
    }

    res.json({ message: "Document deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: userMessage("database"), details: err?.message });
  }
});

export default router;

function mapDocument(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return {
    id: _id.toString(),
    ...rest,
  };
}
