import express from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import { getCollection, toObjectId } from "../db.js";
import { normalizeTeamMembers } from "../utils/teamMembers.js";
import {
  decodeUploadFilename,
  deleteFromR2,
  ensureR2Configured,
  generateStorageKey,
  uploadBufferToR2,
  buildPublicUrl,
  buildMediaProxyPath,
} from "../utils/storage.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin")
    return res.status(403).json({ error: "Admin only" });
  next();
}

function normalizeImageUrl({ image_url, image_storage_key }) {
  const trimmedUrl = typeof image_url === "string" ? image_url.trim() : "";
  if (trimmedUrl) {
    return trimmedUrl;
  }

  if (!image_storage_key) {
    return null;
  }

  try {
    return buildPublicUrl(image_storage_key);
  } catch (error) {
    console.warn("Failed to build project image URL", error);
    return null;
  }
}

function formatProjectDoc(doc) {
  if (!doc) return doc;
  const { _id, team_members, image_url, image_storage_key, ...rest } = doc;
  const normalizedStorageKey =
    typeof image_storage_key === "string" && image_storage_key.trim()
      ? image_storage_key.trim()
      : null;
  const proxyPath = normalizedStorageKey
    ? buildMediaProxyPath(normalizedStorageKey)
    : null;
  const proxyDownloadPath = normalizedStorageKey
    ? buildMediaProxyPath(normalizedStorageKey, { download: true })
    : null;
  return {
    id: _id.toString(),
    ...rest,
    image_storage_key: normalizedStorageKey,
    image_proxy_url: proxyPath,
    image_proxy_download_url: proxyDownloadPath,
    image_url: normalizeImageUrl({
      image_url,
      image_storage_key,
    }),
    team_members: normalizeTeamMembers(team_members),
  };
}

const memoryStorage = multer.memoryStorage();

const projectImageUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(png|jpg|jpeg|gif|webp)$/i;
    if (allowed.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid image type. Allowed: PNG, JPG, JPEG, GIF, WEBP"));
    }
  },
});

router.get("/", async (req, res) => {
  try {
    const projects = getCollection("projects");
    const result = await projects.find({}).sort({ created_at: -1 }).toArray();
    res.json({ projects: result.map(formatProjectDoc) });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      image_url,
      image_storage_key,
      image_filename,
      image_mime_type,
      image_file_size,
      github_url,
      external_url,
      team_members,
    } = req.body;
    if (!title) return res.status(400).json({ error: "Title required" });

    const normalizedTeam = normalizeTeamMembers(team_members);

    const projects = getCollection("projects");
    const now = new Date();
    const doc = {
      title,
      description: description || "",
      status: status || "active",
      image_url: image_url || null,
      image_storage_key: image_storage_key || null,
      image_filename: image_filename || null,
      image_mime_type: image_mime_type || null,
      image_file_size:
        image_file_size != null && Number.isFinite(Number(image_file_size))
          ? Number(image_file_size)
          : null,
      github_url: github_url || null,
      external_url: external_url || null,
      team_members: normalizedTeam,
      created_at: now,
      updated_at: now,
    };

    const result = await projects.insertOne(doc);

    res.status(201).json({
      project: formatProjectDoc({ ...doc, _id: result.insertedId }),
    });
  } catch (err) {
    console.error("Project creation failed:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      image_url,
      image_storage_key,
      image_filename,
      image_mime_type,
      image_file_size,
      github_url,
      external_url,
      team_members,
    } = req.body;
    const { id } = req.params;

    const projectId = toObjectId(id);
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (status !== undefined) updateFields.status = status;
    if (image_url !== undefined) updateFields.image_url = image_url || null;
    if (image_storage_key !== undefined)
      updateFields.image_storage_key = image_storage_key || null;
    if (image_filename !== undefined)
      updateFields.image_filename = image_filename || null;
    if (image_mime_type !== undefined)
      updateFields.image_mime_type = image_mime_type || null;
    if (image_file_size !== undefined) {
      const numericSize = Number(image_file_size);
      updateFields.image_file_size = Number.isFinite(numericSize)
        ? numericSize
        : null;
    }
    if (github_url !== undefined) updateFields.github_url = github_url || null;
    if (external_url !== undefined)
      updateFields.external_url = external_url || null;
    if (team_members !== undefined) {
      updateFields.team_members = normalizeTeamMembers(team_members);
    }

    const projects = getCollection("projects");
    const filters = [];
    if (projectId) {
      filters.push({ _id: projectId });
    }
    if (!projectId || projectId.toString() !== id) {
      filters.push({ _id: id });
    }

    let updatedDoc = null;
    for (const filter of filters) {
      const attempt = await projects.findOneAndUpdate(
        filter,
        {
          $set: {
            ...updateFields,
            updated_at: new Date(),
          },
        },
        { returnDocument: "after" }
      );
      if (attempt.value) {
        updatedDoc = attempt.value;
        break;
      }
    }

    if (!updatedDoc) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({ project: formatProjectDoc(updatedDoc) });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const projectId = toObjectId(id);
    const projects = getCollection("projects");
    const filters = [];
    if (projectId) {
      filters.push({ _id: projectId });
    }
    if (!projectId || projectId.toString() !== id) {
      filters.push({ _id: id });
    }

    let existingDoc = null;
    for (const filter of filters) {
      const candidate = await projects.findOne(filter);
      if (candidate) {
        existingDoc = candidate;
        break;
      }
    }

    let deleted = false;
    for (const filter of filters) {
      const result = await projects.deleteOne(filter);
      if (result.deletedCount > 0) {
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      return res.status(404).json({ error: "Not found" });
    }

    if (existingDoc?.image_storage_key) {
      try {
        await deleteFromR2(existingDoc.image_storage_key);
      } catch (error) {
        if (error?.code === "R2_NOT_CONFIGURED") {
          console.warn("R2 not configured; skipped project image deletion");
        } else {
          console.warn("Failed to delete project image from R2", error);
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

router.post(
  "/upload-image",
  requireAuth,
  requireAdmin,
  (req, res, next) => {
    projectImageUpload.single("image")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      ensureR2Configured();
      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      const cleanOriginalName = decodeUploadFilename(req.file.originalname);
      const storageKey = generateStorageKey({
        directory: "projects",
        originalName: cleanOriginalName,
      });

      const uploadResult = await uploadBufferToR2({
        key: storageKey,
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
        cacheControl: "public, max-age=31536000, immutable",
        metadata: {
          "original-name": cleanOriginalName,
          "uploaded-from": "projects",
        },
      });

      res.json({
        url: uploadResult.url,
        storage_key: storageKey,
        filename: cleanOriginalName,
        mime_type: req.file.mimetype,
        file_size: req.file.size,
        message: "Image uploaded successfully",
      });
    } catch (err) {
      console.error("Project image upload failed", err);
      const status = err?.statusCode || 500;
      res.status(status).json({
        error:
          err?.code === "R2_NOT_CONFIGURED"
            ? err.message
            : "Image upload failed",
        details: err?.code === "R2_NOT_CONFIGURED" ? err.missing : undefined,
      });
    }
  }
);

export default router;
