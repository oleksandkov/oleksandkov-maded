import express from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import { getCollection, toObjectId, ObjectId } from "../db.js";
import { isMailConfigured, sendMail } from "../utils/mailer.js";
import { listTeamMemberEmails } from "../utils/teamDirectory.js";
import {
  decodeUploadFilename,
  ensureR2Configured,
  generateStorageKey,
  uploadBufferToR2,
  buildMediaProxyPath,
  deleteFromR2,
} from "../utils/storage.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

const AUDIO_FILE_REGEX = /\.(mp3|wav|ogg|m4a|aac|flac)$/i;

const memoryStorage = multer.memoryStorage();

function createUpload({ limits, fileFilter }) {
  return multer({
    storage: memoryStorage,
    limits,
    fileFilter,
  });
}

const articleImageUpload = createUpload({
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /(\.png|\.jpg|\.jpeg|\.gif|\.webp)$/i;
    if (allowed.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid image type. Allowed: PNG, JPG, JPEG, GIF, WEBP"));
    }
  },
});

const articleAttachmentUpload = createUpload({
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed =
      /(\.pdf|\.doc|\.docx|\.txt|\.png|\.jpg|\.jpeg|\.gif|\.zip|\.rar|\.ppt|\.pptx)$/i;
    if (allowed.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid attachment type. Allowed: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, GIF, ZIP, RAR, PPT, PPTX"
        )
      );
    }
  },
});

const articleAudioUpload = createUpload({
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (AUDIO_FILE_REGEX.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid audio type. Allowed: MP3, WAV, OGG, M4A, AAC, FLAC")
      );
    }
  },
});

const podcastAudioUpload = createUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (AUDIO_FILE_REGEX.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid audio type. Allowed: MP3, WAV, OGG, M4A, AAC, FLAC")
      );
    }
  },
});

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
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

function getUserPermissions(user) {
  if (!user) return [];
  const list = Array.isArray(user.permissions) ? user.permissions : [];
  return list
    .map((value) =>
      typeof value === "string" ? value.trim().toLowerCase() : ""
    )
    .filter(Boolean);
}

function hasPublishingAccess(user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  const permissions = getUserPermissions(user);
  return permissions.includes("manage_articles");
}

function requirePublisher(req, res, next) {
  if (!hasPublishingAccess(req.user)) {
    return res.status(403).json({ error: "Admin only" });
  }
  return next();
}

function sanitizeTask(task) {
  if (!task || typeof task !== "object") return null;
  const description =
    typeof task.description === "string" ? task.description.trim() : "";
  if (!description) return null;
  const assigneeRaw = task.assignee;
  const assignee =
    assigneeRaw == null ? null : String(assigneeRaw).trim() || null;
  const id =
    typeof task.id === "string" && task.id.trim()
      ? task.id.trim()
      : new ObjectId().toString();
  return { id, description, assignee };
}

function sanitizeTasks(tasks) {
  if (!Array.isArray(tasks)) return [];
  return tasks.map(sanitizeTask).filter(Boolean);
}

function normalizeStorageKey(value) {
  if (!value) return "";
  if (typeof value === "string") {
    return value.trim();
  }
  return String(value).trim();
}

async function deleteStorageKeys(keys = [], { context = "" } = {}) {
  const uniqueKeys = Array.from(
    new Set(
      (Array.isArray(keys) ? keys : [])
        .map((key) => normalizeStorageKey(key))
        .filter(Boolean)
    )
  );

  if (!uniqueKeys.length) {
    return;
  }

  for (const key of uniqueKeys) {
    try {
      await deleteFromR2(key);
    } catch (error) {
      if (error?.code === "R2_NOT_CONFIGURED") {
        const label = context ? ` for ${context}` : "";
        console.warn(`R2 not configured; skipping storage cleanup${label}`);
        break;
      }
      console.warn(
        `Failed to delete storage object ${key}${
          context ? ` (${context})` : ""
        }`,
        error
      );
    }
  }
}

async function cleanupArticleResources(article) {
  if (!article || typeof article !== "object") {
    return;
  }

  const keys = [];
  const addKey = (value) => {
    const normalized = normalizeStorageKey(value);
    if (normalized) {
      keys.push(normalized);
    }
  };

  addKey(article.image_storage_key);

  (article.gallery_images || []).forEach((image) => addKey(image?.storage_key));

  (article.audio_tracks || []).forEach((track) => addKey(track?.storage_key));

  const attachmentDocIds = new Set();

  (article.attachments || []).forEach((attachment) => {
    addKey(attachment?.storage_key);
    const docIdRaw =
      typeof attachment?.document_id === "string"
        ? attachment.document_id
        : attachment?.document_id != null
        ? String(attachment.document_id)
        : "";
    const docId = docIdRaw.trim();
    if (docId) {
      attachmentDocIds.add(docId);
    }
  });

  let attachmentDocs = [];

  if (attachmentDocIds.size) {
    try {
      const documents = getCollection("dashboard_article_documents");
      const candidateMap = new Map();

      for (const id of attachmentDocIds) {
        if (!id) continue;
        candidateMap.set(`string:${id}`, id);
        const objectId = toObjectId(id);
        if (objectId) {
          candidateMap.set(`object:${objectId.toString()}`, objectId);
        }
      }

      const candidates = Array.from(candidateMap.values());

      if (candidates.length) {
        attachmentDocs = await documents
          .find({ _id: { $in: candidates } })
          .toArray();

        if (attachmentDocs.length) {
          const deleteIds = attachmentDocs.map((doc) => doc._id);
          if (deleteIds.length) {
            await documents.deleteMany({ _id: { $in: deleteIds } });
          }
        }
      }
    } catch (error) {
      console.warn("Failed to clean up article attachment documents", error);
    }
  }

  attachmentDocs.forEach((doc) => addKey(doc?.storage_key));

  await deleteStorageKeys(keys, { context: "article" });
}

async function cleanupPodcastResources(podcast) {
  if (!podcast || typeof podcast !== "object") {
    return;
  }

  const keys = [];
  const addKey = (value) => {
    const normalized = normalizeStorageKey(value);
    if (normalized) {
      keys.push(normalized);
    }
  };

  if (podcast.audio) {
    addKey(podcast.audio.storage_key);
  }

  await deleteStorageKeys(keys, { context: "podcast" });
}

function formatTimestamp(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function buildNotificationState(overrides = {}) {
  return {
    sent: false,
    sent_at: null,
    sent_by: null,
    sent_by_email: null,
    sent_by_id: null,
    recipient_count: 0,
    subject: null,
    ...overrides,
  };
}

function formatNotificationState(value) {
  const base = buildNotificationState();
  if (!value || typeof value !== "object") {
    return base;
  }
  const sentAt = formatTimestamp(value.sent_at || value.sentAt);
  const sentByEmailCandidate =
    typeof value.sent_by_email === "string"
      ? value.sent_by_email
      : typeof value.sentByEmail === "string"
      ? value.sentByEmail
      : null;
  const sentByIdCandidate =
    typeof value.sent_by_id === "string"
      ? value.sent_by_id
      : typeof value.sentById === "string"
      ? value.sentById
      : null;
  const recipientCountRaw = Number(
    value.recipient_count ?? value.recipientCount
  );
  const subjectCandidate =
    typeof value.subject === "string"
      ? value.subject
      : typeof value.subjectLine === "string"
      ? value.subjectLine
      : null;
  return {
    ...base,
    sent: Boolean(value.sent || sentAt),
    sent_at: sentAt,
    sent_by: value.sent_by || value.sentBy || null,
    sent_by_email: sentByEmailCandidate,
    sent_by_id: sentByIdCandidate,
    recipient_count: Number.isFinite(recipientCountRaw) ? recipientCountRaw : 0,
    subject: subjectCandidate,
  };
}

function formatNoteDoc(doc) {
  if (!doc) return null;
  const { _id, created_at, updated_at, ...rest } = doc;
  return {
    id: _id?.toString?.() || String(_id),
    ...rest,
    created_at: formatTimestamp(created_at),
    updated_at: formatTimestamp(updated_at),
    tasks: Array.isArray(rest.tasks)
      ? rest.tasks.map((task) => ({
          id: task?.id ? String(task.id) : new ObjectId().toString(),
          description: task?.description || "",
          assignee: task?.assignee || null,
        }))
      : [],
  };
}

function buildCodespaceLauncherUrl(repository, branch, region) {
  if (!repository || typeof repository !== "string") return null;
  const trimmedRepo = repository.trim();
  if (!trimmedRepo.includes("/")) return null;
  const base = `https://github.com/codespaces/new?repo=${encodeURIComponent(
    trimmedRepo
  )}`;
  const params = [];
  if (branch && String(branch).trim()) {
    params.push(`ref=${encodeURIComponent(String(branch).trim())}`);
  }
  if (region && String(region).trim()) {
    params.push(`location=${encodeURIComponent(String(region).trim())}`);
  }
  return params.length ? `${base}&${params.join("&")}` : base;
}

function sanitizeCodespacePayload(payload = {}) {
  const project =
    typeof payload.project === "string" ? payload.project.trim() : "";
  const repository =
    typeof payload.repository === "string" ? payload.repository.trim() : "";
  const branch =
    typeof payload.branch === "string" ? payload.branch.trim() : "";
  const statusRaw =
    typeof payload.status === "string" ? payload.status.trim() : "";
  const status = (statusRaw || "running").toLowerCase();
  const region =
    typeof payload.region === "string" ? payload.region.trim() : "";
  const description =
    typeof payload.description === "string" ? payload.description.trim() : "";
  const urlRaw = typeof payload.url === "string" ? payload.url.trim() : "";
  const repoUrl =
    typeof payload.repo_url === "string" ? payload.repo_url.trim() : "";
  const editorRaw =
    typeof payload.editor === "string" ? payload.editor.trim() : "";
  const editor = (editorRaw || "vscode").toLowerCase();

  const url =
    urlRaw || buildCodespaceLauncherUrl(repository, branch, region) || null;

  return {
    project,
    repository,
    branch: branch || null,
    status: status || "running",
    region: region || null,
    description: description || null,
    url,
    repo_url: repoUrl || null,
    editor: editor || "vscode",
  };
}

function formatCodespaceDoc(doc) {
  if (!doc) return null;
  const { _id, created_at, updated_at, ...rest } = doc;
  return {
    id: _id?.toString?.() || String(_id),
    ...rest,
    created_at: formatTimestamp(created_at),
    updated_at: formatTimestamp(updated_at),
  };
}

function toEmbeddedId(value) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (value instanceof ObjectId) {
    return value.toString();
  }
  return new ObjectId().toString();
}

function normalizeAuthors(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function sanitizeArticleLink(link) {
  if (!link || typeof link !== "object") return null;
  const url = typeof link.url === "string" ? link.url.trim() : "";
  if (!url) return null;
  const label = typeof link.label === "string" ? link.label.trim() : "";
  const description =
    typeof link.description === "string" ? link.description.trim() : "";
  return {
    id: toEmbeddedId(link.id),
    label: label || null,
    url,
    description: description || null,
  };
}

function sanitizeArticleLinks(links) {
  if (!Array.isArray(links)) return [];
  return links.map(sanitizeArticleLink).filter(Boolean);
}

function sanitizeArticleAttachment(attachment) {
  if (!attachment || typeof attachment !== "object") return null;
  const documentId =
    typeof attachment.document_id === "string"
      ? attachment.document_id.trim()
      : "";
  const url = typeof attachment.url === "string" ? attachment.url.trim() : "";
  const storageKey =
    typeof attachment.storage_key === "string"
      ? attachment.storage_key.trim()
      : "";
  if (!documentId && !url && !storageKey) return null;
  const title =
    typeof attachment.title === "string" ? attachment.title.trim() : "";
  const description =
    typeof attachment.description === "string"
      ? attachment.description.trim()
      : "";
  return {
    id: toEmbeddedId(attachment.id),
    document_id: documentId || null,
    title: title || null,
    url: url || null,
    description: description || null,
    filename:
      typeof attachment.filename === "string"
        ? attachment.filename.trim() || null
        : null,
    mime_type:
      typeof attachment.mime_type === "string"
        ? attachment.mime_type.trim() || null
        : null,
    file_size:
      typeof attachment.file_size === "number" && attachment.file_size >= 0
        ? attachment.file_size
        : null,
    storage_key: storageKey || null,
    storage_bucket:
      typeof attachment.storage_bucket === "string"
        ? attachment.storage_bucket.trim() || null
        : null,
  };
}

function sanitizeArticleAttachments(attachments) {
  if (!Array.isArray(attachments)) return [];
  return attachments.map(sanitizeArticleAttachment).filter(Boolean);
}

function sanitizeArticleImage(image) {
  if (!image || typeof image !== "object") return null;
  const url = typeof image.url === "string" ? image.url.trim() : "";
  const storageKey =
    typeof image.storage_key === "string" ? image.storage_key.trim() : "";
  if (!url && !storageKey) return null;
  const alt = typeof image.alt === "string" ? image.alt.trim() : "";
  const caption = typeof image.caption === "string" ? image.caption.trim() : "";
  const filename =
    typeof image.filename === "string" ? image.filename.trim() : "";
  const mimeType =
    typeof image.mime_type === "string" ? image.mime_type.trim() : "";
  const fileSizeRaw = Number(image.file_size);
  return {
    id: toEmbeddedId(image.id),
    url: url || null,
    alt: alt || null,
    caption: caption || null,
    storage_key: storageKey || null,
    filename: filename || null,
    mime_type: mimeType || null,
    file_size:
      Number.isFinite(fileSizeRaw) && fileSizeRaw >= 0 ? fileSizeRaw : null,
  };
}

function sanitizeArticleImages(images) {
  if (!Array.isArray(images)) return [];
  return images.map(sanitizeArticleImage).filter(Boolean);
}

function sanitizeArticleAudioTrack(track) {
  if (!track || typeof track !== "object") return null;
  const url = typeof track.url === "string" ? track.url.trim() : "";
  const storageKey =
    typeof track.storage_key === "string" ? track.storage_key.trim() : "";
  if (!url && !storageKey) return null;
  const title = typeof track.title === "string" ? track.title.trim() : "";
  const description =
    typeof track.description === "string" ? track.description.trim() : "";
  const filename =
    typeof track.filename === "string" ? track.filename.trim() : "";
  const mimeType =
    typeof track.mime_type === "string" ? track.mime_type.trim() : "";
  const downloadUrl =
    typeof track.download_url === "string"
      ? track.download_url.trim() || url
      : url;
  const durationRaw = Number(track.duration_seconds);
  const durationSeconds =
    Number.isFinite(durationRaw) && durationRaw > 0 ? durationRaw : null;
  const fileSizeRaw = Number(track.file_size);
  const fileSize =
    Number.isFinite(fileSizeRaw) && fileSizeRaw >= 0 ? fileSizeRaw : null;

  return {
    id: toEmbeddedId(track.id),
    title: title || null,
    description: description || null,
    url: url || null,
    download_url: downloadUrl,
    filename: filename || null,
    mime_type: mimeType || null,
    file_size: fileSize,
    duration_seconds: durationSeconds,
    storage_key: storageKey || null,
  };
}

function sanitizeArticleAudioTracks(tracks) {
  if (!Array.isArray(tracks)) return [];
  return tracks.map(sanitizeArticleAudioTrack).filter(Boolean);
}

async function enrichAttachmentsWithDocuments(attachments = []) {
  if (!attachments.length) return attachments;
  const idMap = new Map();
  attachments.forEach((attachment) => {
    if (!attachment?.document_id) return;
    const objectId = toObjectId(attachment.document_id);
    if (objectId) {
      idMap.set(objectId.toString(), objectId);
    }
  });

  if (!idMap.size) return attachments;

  const objectIds = Array.from(idMap.values());
  const documents = getCollection("documents");
  const articleDocuments = getCollection("dashboard_article_documents");
  const [sharedDocs, articleDocs] = await Promise.all([
    documents
      .find({ _id: { $in: objectIds } })
      .project({ title: 1, filename: 1, url: 1 })
      .toArray(),
    articleDocuments
      .find({ _id: { $in: objectIds } })
      .project({ title: 1, filename: 1, url: 1 })
      .toArray(),
  ]);

  const docMap = new Map();
  sharedDocs.forEach((doc) => {
    docMap.set(doc._id.toString(), doc);
  });
  articleDocs.forEach((doc) => {
    docMap.set(doc._id.toString(), doc);
  });

  return attachments.map((attachment) => {
    if (!attachment?.document_id) {
      return {
        ...attachment,
        filename: attachment?.filename || null,
        mime_type: attachment?.mime_type || null,
        file_size:
          typeof attachment?.file_size === "number"
            ? attachment.file_size
            : null,
        storage_key: attachment?.storage_key || null,
        storage_bucket: attachment?.storage_bucket || null,
      };
    }

    const storedId = attachment.document_id;
    const doc =
      docMap.get(storedId) ||
      docMap.get(toObjectId(storedId)?.toString?.() || "");

    if (!doc) {
      return {
        ...attachment,
        filename: attachment?.filename || null,
        mime_type: attachment?.mime_type || null,
        file_size:
          typeof attachment?.file_size === "number"
            ? attachment.file_size
            : null,
        storage_key: attachment?.storage_key || null,
        storage_bucket: attachment?.storage_bucket || null,
      };
    }

    return {
      ...attachment,
      title: attachment.title || doc.title || doc.filename || "Linked document",
      url: attachment.url || doc.url || null,
      filename: attachment.filename || doc.filename || null,
      mime_type: attachment.mime_type || doc.mime_type || null,
      file_size:
        typeof attachment.file_size === "number"
          ? attachment.file_size
          : doc.file_size ?? null,
      storage_key: attachment.storage_key || doc.storage_key || null,
      storage_bucket: attachment.storage_bucket || doc.storage_bucket || null,
    };
  });
}

function sanitizeArticleCreatePayload(payload = {}) {
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  if (!title) {
    throw new Error("Title is required");
  }
  const description =
    typeof payload.description === "string" ? payload.description.trim() : "";
  const imageUrl =
    typeof payload.image_url === "string" ? payload.image_url.trim() : "";
  const imageStorageKey =
    typeof payload.image_storage_key === "string"
      ? payload.image_storage_key.trim()
      : "";
  const imageFilename =
    typeof payload.image_filename === "string"
      ? payload.image_filename.trim()
      : "";
  const imageMimeType =
    typeof payload.image_mime_type === "string"
      ? payload.image_mime_type.trim()
      : "";
  const imageFileSizeRaw = Number(payload.image_file_size);
  const imageFileSize =
    Number.isFinite(imageFileSizeRaw) && imageFileSizeRaw >= 0
      ? imageFileSizeRaw
      : null;
  const galleryImages = sanitizeArticleImages(payload.gallery_images);
  const audioTracks = sanitizeArticleAudioTracks(payload.audio_tracks);

  return {
    title,
    description,
    image_url: imageUrl || null,
    image_storage_key: imageStorageKey || null,
    image_filename: imageFilename || null,
    image_mime_type: imageMimeType || null,
    image_file_size: imageFileSize,
    authors: normalizeAuthors(payload.authors),
    links: sanitizeArticleLinks(payload.links),
    attachments: sanitizeArticleAttachments(payload.attachments),
    gallery_images: galleryImages,
    audio_tracks: audioTracks,
  };
}

function sanitizeArticleUpdatePayload(payload = {}) {
  const update = {};

  if (Object.prototype.hasOwnProperty.call(payload, "title")) {
    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    if (!title) {
      throw new Error("Title is required");
    }
    update.title = title;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "description")) {
    update.description =
      typeof payload.description === "string" ? payload.description.trim() : "";
  }

  if (Object.prototype.hasOwnProperty.call(payload, "image_url")) {
    const imageUrl =
      typeof payload.image_url === "string" ? payload.image_url.trim() : "";
    update.image_url = imageUrl || null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "image_storage_key")) {
    const storageKey =
      typeof payload.image_storage_key === "string"
        ? payload.image_storage_key.trim()
        : "";
    update.image_storage_key = storageKey || null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "image_filename")) {
    const filename =
      typeof payload.image_filename === "string"
        ? payload.image_filename.trim()
        : "";
    update.image_filename = filename || null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "image_mime_type")) {
    const mimeType =
      typeof payload.image_mime_type === "string"
        ? payload.image_mime_type.trim()
        : "";
    update.image_mime_type = mimeType || null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "image_file_size")) {
    const fileSizeRaw = Number(payload.image_file_size);
    update.image_file_size =
      Number.isFinite(fileSizeRaw) && fileSizeRaw >= 0 ? fileSizeRaw : null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "authors")) {
    update.authors = normalizeAuthors(payload.authors);
  }

  if (Object.prototype.hasOwnProperty.call(payload, "links")) {
    update.links = sanitizeArticleLinks(payload.links);
  }

  if (Object.prototype.hasOwnProperty.call(payload, "attachments")) {
    update.attachments = sanitizeArticleAttachments(payload.attachments);
  }

  if (Object.prototype.hasOwnProperty.call(payload, "gallery_images")) {
    update.gallery_images = sanitizeArticleImages(payload.gallery_images);
  }

  if (Object.prototype.hasOwnProperty.call(payload, "audio_tracks")) {
    update.audio_tracks = sanitizeArticleAudioTracks(payload.audio_tracks);
  }

  return update;
}

function formatArticleDoc(doc, options = {}) {
  if (!doc) return null;
  const {
    _id,
    created_at,
    updated_at,
    links = [],
    attachments = [],
    gallery_images = [],
    audio_tracks = [],
    image_storage_key,
    notification_state,
    ...rest
  } = doc;

  const req = options.req || null;
  const absoluteMedia = Boolean(options.absoluteMedia);
  const heroStorageKey =
    typeof image_storage_key === "string"
      ? image_storage_key
      : typeof rest.image_storage_key === "string"
      ? rest.image_storage_key
      : null;
  const imageProxyUrl = heroStorageKey
    ? buildProxyUrl(heroStorageKey, { req, absolute: absoluteMedia })
    : null;
  const imageProxyDownloadUrl = heroStorageKey
    ? buildProxyUrl(heroStorageKey, {
        req,
        absolute: absoluteMedia,
        download: true,
      })
    : null;
  const formattedNotificationState =
    formatNotificationState(notification_state);

  return {
    id: _id?.toString?.() || String(_id),
    ...rest,
    image_storage_key: heroStorageKey || null,
    image_proxy_url: imageProxyUrl,
    image_proxy_download_url: imageProxyDownloadUrl,
    notification_state: formattedNotificationState,
    links: (links || []).map((link) => ({
      id: toEmbeddedId(link?.id),
      label: link?.label || null,
      url: link?.url || "",
      description: link?.description || null,
    })),
    attachments: (attachments || []).map((attachment) => {
      const storageKey =
        typeof attachment?.storage_key === "string"
          ? attachment.storage_key
          : null;
      const proxyUrl = storageKey
        ? buildProxyUrl(storageKey, { req, absolute: absoluteMedia })
        : attachment?.url || null;
      const proxyDownloadUrl = storageKey
        ? buildProxyUrl(storageKey, {
            req,
            absolute: absoluteMedia,
            download: true,
          })
        : attachment?.download_url || attachment?.url || null;

      return {
        id: toEmbeddedId(attachment?.id),
        document_id: attachment?.document_id
          ? String(attachment.document_id)
          : null,
        title: attachment?.title || null,
        url: attachment?.url || null,
        download_url: attachment?.download_url || attachment?.url || null,
        proxy_url: proxyUrl,
        proxy_download_url: proxyDownloadUrl,
        description: attachment?.description || null,
        filename: attachment?.filename || null,
        mime_type: attachment?.mime_type || null,
        file_size:
          typeof attachment?.file_size === "number"
            ? attachment.file_size
            : null,
        storage_key: storageKey || null,
        storage_bucket: attachment?.storage_bucket || null,
      };
    }),
    gallery_images: (gallery_images || []).map((image) => {
      const storageKey =
        typeof image?.storage_key === "string" ? image.storage_key : null;
      const proxyUrl = storageKey
        ? buildProxyUrl(storageKey, { req, absolute: absoluteMedia })
        : image?.url || null;
      return {
        id: toEmbeddedId(image?.id),
        url: image?.url || proxyUrl || "",
        proxy_url: proxyUrl,
        alt: image?.alt || null,
        caption: image?.caption || null,
        storage_key: storageKey || null,
        filename: image?.filename || null,
        mime_type: image?.mime_type || null,
        file_size:
          typeof image?.file_size === "number" ? image.file_size : null,
      };
    }),
    audio_tracks: (audio_tracks || []).map((track) => {
      const storageKey =
        typeof track?.storage_key === "string" ? track.storage_key : null;
      const streamUrl = storageKey
        ? buildProxyUrl(storageKey, { req, absolute: absoluteMedia })
        : track?.url || null;
      const proxyDownloadUrl = storageKey
        ? buildProxyUrl(storageKey, {
            req,
            absolute: absoluteMedia,
            download: true,
          })
        : track?.download_url || track?.url || null;
      return {
        id: toEmbeddedId(track?.id),
        title: track?.title || null,
        description: track?.description || null,
        url: track?.url || "",
        download_url: track?.download_url || track?.url || "",
        stream_url: streamUrl,
        download_proxy_url: proxyDownloadUrl,
        filename: track?.filename || null,
        mime_type: track?.mime_type || null,
        file_size:
          typeof track?.file_size === "number" ? track.file_size : null,
        duration_seconds:
          typeof track?.duration_seconds === "number"
            ? track.duration_seconds
            : null,
        storage_key: storageKey || null,
        storage_bucket: track?.storage_bucket || null,
      };
    }),
    created_at: formatTimestamp(created_at),
    updated_at: formatTimestamp(updated_at),
  };
}

function formatDocument(doc) {
  if (!doc) return null;
  const { _id, created_at, updated_at, ...rest } = doc;
  return {
    id: _id?.toString?.() || String(_id),
    ...rest,
    created_at: formatTimestamp(created_at),
    updated_at: formatTimestamp(updated_at),
  };
}

function normalizeEmail(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function extractEmailKey(value) {
  if (!value) return "";
  const stringValue = String(value).trim();
  if (!stringValue) return "";
  const match = stringValue.match(/<([^>]+)>/);
  const address = match ? match[1] : stringValue;
  return address.trim().toLowerCase();
}

function parseRecipientList(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((value) => (value == null ? "" : String(value).trim()))
      .filter(Boolean);
  }
  return String(input)
    .split(/[,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function dedupeEmails(values = []) {
  const seen = new Set();
  const result = [];
  values.forEach((value) => {
    const normalized = normalizeEmail(value);
    if (!normalized) return;
    const key = extractEmailKey(normalized);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(normalized);
  });
  return result;
}

async function listOptInNotificationEmails() {
  try {
    const users = getCollection("users");
    const guests = getCollection("users_guest");
    const [userDocs, guestDocs] = await Promise.all([
      users
        .find({ notification_opt_in: true }, { projection: { email: 1 } })
        .toArray()
        .catch(() => []),
      guests
        .find(
          {
            notification_opt_in: true,
            $or: [{ verified: { $exists: false } }, { verified: true }],
          },
          { projection: { email: 1 } }
        )
        .toArray()
        .catch(() => []),
    ]);
    return dedupeEmails([
      ...userDocs.map((doc) => doc.email),
      ...guestDocs.map((doc) => doc.email),
    ]);
  } catch (error) {
    console.error("Failed to load notification subscribers", error);
    return [];
  }
}

async function getNotificationRecipients(extraRecipients = []) {
  const envRaw = process.env.CONTENT_NOTIFICATION_RECIPIENTS;
  const envRecipients = parseRecipientList(envRaw);
  const directoryRecipients = listTeamMemberEmails();
  const subscriberRecipients = await listOptInNotificationEmails();
  const extras = parseRecipientList(extraRecipients);
  return dedupeEmails([
    ...envRecipients,
    ...directoryRecipients,
    ...subscriberRecipients,
    ...extras,
  ]);
}

function getRequestOrigin(req) {
  if (!req) return "";
  const forwardedProto = req.headers?.["x-forwarded-proto"];
  const protocolCandidate = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto;
  const protocol = protocolCandidate || req.protocol || "https";
  const host = req.get("host");
  if (!host) return "";
  return `${protocol}://${host}`;
}

function buildProxyUrl(
  storageKey,
  { req, download = false, absolute = false } = {}
) {
  const path = buildMediaProxyPath(storageKey, { download });
  if (!path) {
    return null;
  }
  if (!absolute) {
    return path;
  }
  const origin = getRequestOrigin(req);
  return origin ? `${origin}${path}` : path;
}

function buildDashboardPublicUrl(req, anchor = "") {
  const basePath = "/dashboard.html";
  const anchorPart = anchor
    ? anchor.startsWith("#")
      ? anchor
      : `#${anchor}`
    : "";
  const origin = getRequestOrigin(req);
  if (!origin) {
    return `${basePath}${anchorPart}`;
  }
  return `${origin}${basePath}${anchorPart}`;
}

async function findDashboardArticle(id) {
  const articles = getCollection("dashboard_articles");
  const objectId = toObjectId(id);
  const filters = [];
  if (objectId) {
    filters.push({ _id: objectId });
  }
  if (!objectId || objectId.toString() !== id) {
    filters.push({ _id: id });
  }
  for (const filter of filters) {
    const doc = await articles.findOne(filter);
    if (doc) {
      return doc;
    }
  }
  return null;
}

async function findDashboardPodcast(id) {
  const podcasts = getCollection("dashboard_podcasts");
  const objectId = toObjectId(id);
  const filters = [];
  if (objectId) {
    filters.push({ _id: objectId });
  }
  if (!objectId || objectId.toString() !== id) {
    filters.push({ _id: id });
  }
  for (const filter of filters) {
    const doc = await podcasts.findOne(filter);
    if (doc) {
      return doc;
    }
  }
  return null;
}

function sanitizePodcastAudio(audio = {}) {
  if (!audio || typeof audio !== "object") return null;
  const url = typeof audio.url === "string" ? audio.url.trim() : "";
  const storageKey =
    typeof audio.storage_key === "string" ? audio.storage_key.trim() : "";
  if (!url && !storageKey) return null;
  const title = typeof audio.title === "string" ? audio.title.trim() : "";
  const description =
    typeof audio.description === "string" ? audio.description.trim() : "";
  const filename =
    typeof audio.filename === "string" ? audio.filename.trim() : "";
  const mimeType =
    typeof audio.mime_type === "string" ? audio.mime_type.trim() : "";
  const downloadUrl =
    typeof audio.download_url === "string"
      ? audio.download_url.trim() || url
      : url;
  const fileSizeRaw = Number(audio.file_size);
  const fileSize =
    Number.isFinite(fileSizeRaw) && fileSizeRaw >= 0 ? fileSizeRaw : null;
  const durationRaw = Number(audio.duration_seconds);
  const durationSeconds =
    Number.isFinite(durationRaw) && durationRaw > 0 ? durationRaw : null;

  return {
    id: toEmbeddedId(audio.id),
    title: title || null,
    description: description || null,
    url: url || null,
    download_url: downloadUrl,
    filename: filename || null,
    mime_type: mimeType || null,
    file_size: fileSize,
    duration_seconds: durationSeconds,
    storage_key: storageKey || null,
  };
}

function sanitizePodcastCreatePayload(payload = {}) {
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  if (!title) {
    throw new Error("Title is required");
  }
  const description =
    typeof payload.description === "string" ? payload.description.trim() : "";
  const authors = normalizeAuthors(payload.authors);
  const audio = sanitizePodcastAudio(payload.audio);
  if (!audio) {
    throw new Error("Podcast audio is required");
  }
  return {
    title,
    description,
    authors,
    audio,
  };
}

function sanitizePodcastUpdatePayload(payload = {}) {
  const update = {};
  if (Object.prototype.hasOwnProperty.call(payload, "title")) {
    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    if (!title) {
      throw new Error("Title is required");
    }
    update.title = title;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "description")) {
    update.description =
      typeof payload.description === "string" ? payload.description.trim() : "";
  }
  if (Object.prototype.hasOwnProperty.call(payload, "authors")) {
    update.authors = normalizeAuthors(payload.authors);
  }
  if (Object.prototype.hasOwnProperty.call(payload, "audio")) {
    const audio = sanitizePodcastAudio(payload.audio);
    if (!audio) {
      throw new Error("Podcast audio is required");
    }
    update.audio = audio;
  }
  return update;
}

function formatPodcastDoc(doc, options = {}) {
  if (!doc) return null;
  const {
    _id,
    created_at,
    updated_at,
    audio,
    authors: rawAuthors,
    notification_state,
    ...rest
  } = doc;
  const req = options.req || null;
  const absoluteMedia = Boolean(options.absoluteMedia);
  const authors = normalizeAuthors(rawAuthors);

  let formattedAudio = null;
  if (audio) {
    const sanitized = sanitizePodcastAudio(audio);
    if (sanitized) {
      const storageKey =
        typeof sanitized.storage_key === "string" && sanitized.storage_key
          ? sanitized.storage_key
          : typeof audio.storage_key === "string" && audio.storage_key
          ? audio.storage_key
          : null;

      const streamUrl = storageKey
        ? buildProxyUrl(storageKey, { req, absolute: absoluteMedia })
        : sanitized.url || null;
      const downloadProxyUrl = storageKey
        ? buildProxyUrl(storageKey, {
            req,
            absolute: absoluteMedia,
            download: true,
          })
        : sanitized.download_url || sanitized.url || null;

      formattedAudio = {
        ...sanitized,
        stream_url: streamUrl,
        download_proxy_url: downloadProxyUrl,
      };

      if (!formattedAudio.url && streamUrl) {
        formattedAudio.url = streamUrl;
      }
      if (!formattedAudio.download_url && downloadProxyUrl) {
        formattedAudio.download_url = downloadProxyUrl;
      }
    }
  }

  return {
    id: _id?.toString?.() || String(_id),
    ...rest,
    authors,
    audio: formattedAudio,
    created_at: formatTimestamp(created_at),
    updated_at: formatTimestamp(updated_at),
    notification_state: formatNotificationState(notification_state),
  };
}

router.get("/articles", requireAuth, async (req, res) => {
  try {
    const articles = getCollection("dashboard_articles");
    const result = await articles
      .find({})
      .sort({ updated_at: -1, created_at: -1 })
      .toArray();
    res.json({
      articles: result.map((doc) =>
        formatArticleDoc(doc, { req, absoluteMedia: false })
      ),
    });
  } catch (err) {
    console.error("Failed to load dashboard articles", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/podcasts", requireAuth, async (req, res) => {
  try {
    const podcasts = getCollection("dashboard_podcasts");
    const result = await podcasts
      .find({})
      .sort({ updated_at: -1, created_at: -1 })
      .toArray();
    res.json({
      podcasts: result.map((doc) => formatPodcastDoc(doc, { req })),
    });
  } catch (err) {
    console.error("Failed to load dashboard podcasts", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.use(requireAuth);

router.post("/articles", requireAdmin, async (req, res) => {
  try {
    const payload = sanitizeArticleCreatePayload(req.body || {});
    payload.attachments = await enrichAttachmentsWithDocuments(
      payload.attachments
    );
    const now = new Date();
    const doc = {
      ...payload,
      created_at: now,
      updated_at: now,
      created_by: req.user?.id || null,
      updated_by: req.user?.id || null,
      notification_state: buildNotificationState(),
    };

    const articles = getCollection("dashboard_articles");
    const result = await articles.insertOne(doc);
    res
      .status(201)
      .json({ article: formatArticleDoc({ ...doc, _id: result.insertedId }) });
  } catch (err) {
    if (err.message === "Title is required") {
      return res.status(400).json({ error: err.message });
    }
    console.error("Failed to create dashboard article", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.put("/articles/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const update = sanitizeArticleUpdatePayload(req.body || {});
    if (!Object.keys(update).length) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    if (update.attachments) {
      update.attachments = await enrichAttachmentsWithDocuments(
        update.attachments
      );
    }

    update.updated_at = new Date();
    update.updated_by = req.user?.id || null;

    const articles = getCollection("dashboard_articles");
    const objectId = toObjectId(id);
    const filters = [];
    if (objectId) filters.push({ _id: objectId });
    if (!objectId || objectId.toString() !== id) filters.push({ _id: id });

    let updatedDoc = null;
    for (const filter of filters) {
      const attempt = await articles.findOneAndUpdate(
        filter,
        { $set: update },
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

    res.json({ article: formatArticleDoc(updatedDoc) });
  } catch (err) {
    if (err.message === "Title is required") {
      return res.status(400).json({ error: err.message });
    }
    console.error("Failed to update dashboard article", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.delete("/articles/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const articleDoc = await findDashboardArticle(id);

    if (!articleDoc) {
      return res.status(404).json({ error: "Not found" });
    }

    const articles = getCollection("dashboard_articles");
    const filters = [];
    const filterTracker = new Set();

    const addFilter = (value) => {
      if (!value) return;
      const type = value?.constructor?.name || typeof value;
      const asString =
        typeof value === "object" && typeof value?.toString === "function"
          ? value.toString()
          : String(value);
      const trackerKey = `${type}:${asString}`;
      if (filterTracker.has(trackerKey)) {
        return;
      }
      filterTracker.add(trackerKey);
      filters.push({ _id: value });
    };

    addFilter(articleDoc._id);
    addFilter(id);
    addFilter(toObjectId(id));

    let deleted = false;
    for (const filter of filters) {
      const result = await articles.deleteOne(filter);
      if (result.deletedCount > 0) {
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      return res.status(404).json({ error: "Not found" });
    }

    try {
      await cleanupArticleResources(articleDoc);
    } catch (cleanupError) {
      console.warn("Failed to clean up article storage", cleanupError);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete dashboard article", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/articles/:id/notify", requireAdmin, async (req, res) => {
  if (!isMailConfigured()) {
    return res.status(503).json({
      error:
        "Email service is not configured. Set SMTP credentials to enable notifications.",
    });
  }

  try {
    const { id } = req.params;
    const articleDoc = await findDashboardArticle(id);
    if (!articleDoc) {
      return res.status(404).json({ error: "Article not found" });
    }

    const existingNotification = formatNotificationState(
      articleDoc.notification_state
    );
    if (existingNotification.sent) {
      return res
        .status(409)
        .json({ error: "Notification already sent for this article." });
    }

    const article = formatArticleDoc(articleDoc, { req });
    const recipients = await getNotificationRecipients(
      req.body?.extraRecipients
    );

    if (!recipients.length) {
      return res
        .status(400)
        .json({ error: "No notification recipients configured" });
    }

    const alertTypeRaw =
      typeof req.body?.alertType === "string" ? req.body.alertType.trim() : "";
    const alertType = alertTypeRaw
      ? alertTypeRaw.toLowerCase()
      : "content-update";

    const defaultSubject =
      alertType === "suspicious-device"
        ? `Security alert: activity detected for "${article.title}"`
        : `New article update: ${article.title}`;
    const subject =
      typeof req.body?.subject === "string" && req.body.subject.trim()
        ? req.body.subject.trim()
        : defaultSubject;

    const description = article.description || "A new article is ready.";
    const timestampValue =
      article.updated_at || article.created_at || new Date();
    const timestamp = new Date(timestampValue);
    const formattedTimestamp = Number.isNaN(timestamp.getTime())
      ? new Date().toLocaleString()
      : timestamp.toLocaleString();
    const dashboardUrl = buildDashboardPublicUrl(req, "guest-articles-wrapper");
    const triggeredBy =
      [req.user?.name, req.user?.surname]
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean)
        .join(" ") ||
      normalizeEmail(req.user?.email) ||
      "Unknown user";
    const extraMessage =
      typeof req.body?.message === "string" ? req.body.message.trim() : "";

    const deviceText =
      alertType === "suspicious-device"
        ? "This notification has been marked as a suspicious device alert. If you did not initiate this change, please investigate immediately."
        : "Share this update when you're ready.";

    const textSections = [
      "Hello, here some news.",
      `Title: ${article.title}`,
      `Updated: ${formattedTimestamp}`,
      description ? `Summary: ${description}` : null,
      Array.isArray(article.authors) && article.authors.length
        ? `Authors: ${article.authors.join(", ")}`
        : null,
      article.links && article.links.length && article.links[0]?.url
        ? `Primary link: ${article.links[0].url}`
        : null,
      extraMessage || null,
      deviceText,
      `Dashboard: ${dashboardUrl}`,
    ].filter(Boolean);

    const htmlSections = [];
    htmlSections.push(`<p>Hello, here some news.</p>`);
    htmlSections.push(`<p><strong>${escapeHtml(article.title)}</strong></p>`);
    if (description) {
      htmlSections.push(`<p>${escapeHtml(description)}</p>`);
    }
    if (Array.isArray(article.authors) && article.authors.length) {
      htmlSections.push(
        `<p><strong>Authors:</strong> ${article.authors
          .map((author) => escapeHtml(String(author)))
          .join(", ")}</p>`
      );
    }
    htmlSections.push(
      `<p><strong>Updated:</strong> ${escapeHtml(formattedTimestamp)}</p>`
    );
    if (article.links && article.links.length && article.links[0]?.url) {
      const linkUrl = escapeHtml(article.links[0].url);
      const linkLabel = escapeHtml(
        article.links[0].label || article.links[0].url
      );
      htmlSections.push(
        `<p><strong>Primary link:</strong> <a href="${linkUrl}" target="_blank" rel="noopener">${linkLabel}</a></p>`
      );
    }
    if (extraMessage) {
      htmlSections.push(`<p>${escapeHtml(extraMessage)}</p>`);
    }
    htmlSections.push(`<p>${escapeHtml(deviceText)}</p>`);
    htmlSections.push(
      `<p><a href="${escapeHtml(
        dashboardUrl
      )}" target="_blank" rel="noopener">Open the dashboard</a></p>`
    );

    const mailResult = await sendMail({
      to: recipients,
      subject,
      text: textSections.join("\n\n"),
      html: htmlSections.join("\n"),
    });

    const articles = getCollection("dashboard_articles");
    const now = new Date();
    const notificationState = buildNotificationState({
      sent: true,
      sent_at: now,
      sent_by: triggeredBy,
      sent_by_email: normalizeEmail(req.user?.email) || null,
      sent_by_id: req.user?.id || null,
      recipient_count: recipients.length,
      subject,
    });

    await articles.updateOne(
      { _id: articleDoc._id },
      {
        $set: {
          notification_state: notificationState,
          updated_at: now,
          updated_by: req.user?.id || null,
        },
      }
    );

    articleDoc.notification_state = notificationState;
    articleDoc.updated_at = now;
    articleDoc.updated_by = req.user?.id || null;
    const formattedArticle = formatArticleDoc(articleDoc, { req });

    res.json({
      success: true,
      article: {
        id: formattedArticle.id,
        title: formattedArticle.title,
        notification_state: formattedArticle.notification_state,
      },
      sent_to: mailResult.to,
      cc: mailResult.cc || [],
      bcc: mailResult.bcc || [],
      message_id: mailResult.messageId || null,
      preview_url: mailResult.previewUrl || null,
      recipient_count: recipients.length,
    });
  } catch (err) {
    console.error("Failed to send article notification", err);
    const status =
      typeof err?.statusCode === "number" && err.statusCode >= 400
        ? err.statusCode
        : 500;
    res.status(status).json({
      error: "Failed to send article notification",
      details: err?.message || null,
      code: err?.code || null,
      response: err?.response || null,
    });
  }
});

router.post(
  "/articles/upload-image",
  requireAdmin,
  (req, res, next) => {
    articleImageUpload.single("image")(req, res, (err) => {
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
        directory: "articles/images",
        originalName: cleanOriginalName,
      });

      const uploadResult = await uploadBufferToR2({
        key: storageKey,
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
        cacheControl: "public, max-age=31536000, immutable",
        metadata: {
          "original-name": cleanOriginalName,
          "uploaded-from": "dashboard-article-image",
        },
      });

      const proxyUrl = buildMediaProxyPath(storageKey) || null;
      const proxyDownloadUrl =
        buildMediaProxyPath(storageKey, { download: true }) || null;

      res.json({
        url: uploadResult.url,
        storage_key: storageKey,
        proxy_url: proxyUrl,
        proxy_download_url: proxyDownloadUrl,
        filename: cleanOriginalName,
        mime_type: req.file.mimetype,
        file_size: req.file.size,
        message: "Image uploaded successfully",
      });
    } catch (err) {
      console.error("Article image upload failed", err);
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

router.post(
  "/articles/upload-audio",
  requireAdmin,
  (req, res, next) => {
    articleAudioUpload.single("audio")(req, res, (err) => {
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
        return res.status(400).json({ error: "No audio uploaded" });
      }

      const cleanOriginalName = decodeUploadFilename(req.file.originalname);
      const trackId = new ObjectId();
      const storageKey = generateStorageKey({
        directory: "articles/audio",
        originalName: cleanOriginalName,
      });

      const uploadResult = await uploadBufferToR2({
        key: storageKey,
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
        cacheControl: "public, max-age=604800",
        metadata: {
          "original-name": cleanOriginalName,
          "uploaded-from": "dashboard-article-audio",
        },
      });

      res.json({
        track: {
          id: trackId.toString(),
          title: cleanOriginalName.replace(/\.[^/.]+$/, ""),
          filename: cleanOriginalName,
          url: uploadResult.url,
          download_url: uploadResult.url,
          storage_key: storageKey,
          mime_type: req.file.mimetype,
          file_size: req.file.size,
        },
        message: "Audio uploaded successfully",
      });
    } catch (err) {
      console.error("Article audio upload failed", err);
      const status = err?.statusCode || 500;
      res.status(status).json({
        error:
          err?.code === "R2_NOT_CONFIGURED"
            ? err.message
            : "Audio upload failed",
        details: err?.code === "R2_NOT_CONFIGURED" ? err.missing : undefined,
      });
    }
  }
);

router.post(
  "/articles/upload-attachment",
  requireAdmin,
  (req, res, next) => {
    articleAttachmentUpload.single("attachment")(req, res, (err) => {
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
        return res.status(400).json({ error: "No attachment uploaded" });
      }

      const cleanOriginalName = decodeUploadFilename(req.file.originalname);
      const storageKey = generateStorageKey({
        directory: "articles/attachments",
        originalName: cleanOriginalName,
      });

      const uploadResult = await uploadBufferToR2({
        key: storageKey,
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
        cacheControl: "public, max-age=31536000",
        metadata: {
          "original-name": cleanOriginalName,
          "uploaded-from": "dashboard-article-attachment",
        },
      });

      const documents = getCollection("dashboard_article_documents");
      const now = new Date();
      const titleRaw =
        typeof req.body?.title === "string" ? req.body.title.trim() : "";
      const descriptionRaw =
        typeof req.body?.description === "string"
          ? req.body.description.trim()
          : "";
      const adminOnly =
        req.body?.admin_only === "true" || req.body?.admin_only === true;

      const doc = {
        title: titleRaw || cleanOriginalName,
        description: descriptionRaw || null,
        admin_only: adminOnly || false,
        url: uploadResult.url,
        storage_key: storageKey,
        storage_bucket: process.env.R2_BUCKET_NAME || null,
        storage_provider: "cloudflare-r2",
        filename: cleanOriginalName,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        created_at: now,
        updated_at: now,
        uploaded_from: "dashboard-article",
        created_by: req.user?.id || null,
        updated_by: req.user?.id || null,
      };

      const result = await documents.insertOne(doc);

      res.json({
        document: {
          ...formatDocument({ ...doc, _id: result.insertedId }),
          scope: "article",
        },
        message: "Attachment uploaded successfully",
      });
    } catch (err) {
      console.error("Article attachment upload failed", err);
      const status = err?.statusCode || 500;
      res.status(status).json({
        error:
          err?.code === "R2_NOT_CONFIGURED"
            ? err.message
            : "Attachment upload failed",
        details: err?.code === "R2_NOT_CONFIGURED" ? err.missing : undefined,
      });
    }
  }
);

router.get("/articles/documents", requireAdmin, async (req, res) => {
  try {
    const documents = getCollection("dashboard_article_documents");
    const result = await documents
      .find({})
      .sort({ created_at: -1, _id: -1 })
      .toArray();
    res.json({
      documents: result.map((doc) => ({
        ...formatDocument(doc),
        scope: "article",
      })),
    });
  } catch (err) {
    console.error("Failed to load article documents", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post(
  "/podcasts/upload-audio",
  requireAdmin,
  (req, res, next) => {
    podcastAudioUpload.single("audio")(req, res, (err) => {
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
        return res.status(400).json({ error: "No audio uploaded" });
      }

      const cleanOriginalName = decodeUploadFilename(req.file.originalname);
      const audioId = new ObjectId();
      const storageKey = generateStorageKey({
        directory: "podcasts/audio",
        originalName: cleanOriginalName,
      });

      const uploadResult = await uploadBufferToR2({
        key: storageKey,
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
        cacheControl: "public, max-age=604800",
        metadata: {
          "original-name": cleanOriginalName,
          "uploaded-from": "dashboard-podcast-audio",
        },
      });

      res.json({
        audio: {
          id: audioId.toString(),
          title: cleanOriginalName.replace(/\.[^/.]+$/, ""),
          filename: cleanOriginalName,
          url: uploadResult.url,
          download_url: uploadResult.url,
          storage_key: storageKey,
          mime_type: req.file.mimetype,
          file_size: req.file.size,
        },
        message: "Podcast audio uploaded successfully",
      });
    } catch (err) {
      console.error("Podcast audio upload failed", err);
      const status = err?.statusCode || 500;
      res.status(status).json({
        error:
          err?.code === "R2_NOT_CONFIGURED"
            ? err.message
            : "Audio upload failed",
        details: err?.code === "R2_NOT_CONFIGURED" ? err.missing : undefined,
      });
    }
  }
);

router.post("/podcasts", requireAdmin, async (req, res) => {
  try {
    const payload = sanitizePodcastCreatePayload(req.body || {});
    const now = new Date();
    const doc = {
      ...payload,
      created_at: now,
      updated_at: now,
      created_by: req.user?.id || null,
      updated_by: req.user?.id || null,
      notification_state: buildNotificationState(),
    };

    const podcasts = getCollection("dashboard_podcasts");
    const result = await podcasts.insertOne(doc);
    res.status(201).json({
      podcast: formatPodcastDoc({ ...doc, _id: result.insertedId }),
    });
  } catch (err) {
    if (err.message && /required/i.test(err.message)) {
      return res.status(400).json({ error: err.message });
    }
    console.error("Failed to create podcast", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.put("/podcasts/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const update = sanitizePodcastUpdatePayload(req.body || {});
    if (!Object.keys(update).length) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    update.updated_at = new Date();
    update.updated_by = req.user?.id || null;

    const podcasts = getCollection("dashboard_podcasts");
    const objectId = toObjectId(id);
    const filters = [];
    if (objectId) filters.push({ _id: objectId });
    if (!objectId || objectId.toString() !== id) filters.push({ _id: id });

    let updatedDoc = null;
    for (const filter of filters) {
      const attempt = await podcasts.findOneAndUpdate(
        filter,
        { $set: update },
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

    res.json({ podcast: formatPodcastDoc(updatedDoc) });
  } catch (err) {
    if (err.message && /required/i.test(err.message)) {
      return res.status(400).json({ error: err.message });
    }
    console.error("Failed to update podcast", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.delete("/podcasts/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const podcastDoc = await findDashboardPodcast(id);

    if (!podcastDoc) {
      return res.status(404).json({ error: "Not found" });
    }

    const podcasts = getCollection("dashboard_podcasts");
    const filters = [];
    const filterTracker = new Set();

    const addFilter = (value) => {
      if (!value) return;
      const type = value?.constructor?.name || typeof value;
      const asString =
        typeof value === "object" && typeof value?.toString === "function"
          ? value.toString()
          : String(value);
      const trackerKey = `${type}:${asString}`;
      if (filterTracker.has(trackerKey)) {
        return;
      }
      filterTracker.add(trackerKey);
      filters.push({ _id: value });
    };

    addFilter(podcastDoc._id);
    addFilter(id);
    addFilter(toObjectId(id));

    let deleted = false;
    for (const filter of filters) {
      const result = await podcasts.deleteOne(filter);
      if (result.deletedCount > 0) {
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      return res.status(404).json({ error: "Not found" });
    }

    try {
      await cleanupPodcastResources(podcastDoc);
    } catch (cleanupError) {
      console.warn("Failed to clean up podcast storage", cleanupError);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete podcast", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/podcasts/:id/notify", requireAdmin, async (req, res) => {
  if (!isMailConfigured()) {
    return res.status(503).json({
      error:
        "Email service is not configured. Set SMTP credentials to enable notifications.",
    });
  }

  try {
    const { id } = req.params;
    const podcastDoc = await findDashboardPodcast(id);
    if (!podcastDoc) {
      return res.status(404).json({ error: "Podcast not found" });
    }

    const podcast = formatPodcastDoc(podcastDoc);
    if (!podcast?.audio) {
      return res
        .status(400)
        .json({ error: "Podcast audio is missing or invalid" });
    }

    const existingNotification = formatNotificationState(
      podcastDoc.notification_state
    );
    if (existingNotification.sent) {
      return res
        .status(409)
        .json({ error: "Notification already sent for this podcast." });
    }

    const recipients = await getNotificationRecipients(
      req.body?.extraRecipients
    );
    if (!recipients.length) {
      return res
        .status(400)
        .json({ error: "No notification recipients configured" });
    }

    const alertTypeRaw =
      typeof req.body?.alertType === "string" ? req.body.alertType.trim() : "";
    const alertType = alertTypeRaw
      ? alertTypeRaw.toLowerCase()
      : "content-update";

    const defaultSubject =
      alertType === "suspicious-device"
        ? `Security alert: activity detected for "${podcast.title}"`
        : `New podcast episode: ${podcast.title}`;
    const subject =
      typeof req.body?.subject === "string" && req.body.subject.trim()
        ? req.body.subject.trim()
        : defaultSubject;

    const description =
      podcast.description || "A new podcast update is ready to share.";
    const timestampValue =
      podcast.updated_at || podcast.created_at || new Date();
    const timestamp = new Date(timestampValue);
    const formattedTimestamp = Number.isNaN(timestamp.getTime())
      ? new Date().toLocaleString()
      : timestamp.toLocaleString();
    const dashboardUrl = buildDashboardPublicUrl(req, "guest-podcasts-wrapper");
    const triggeredBy =
      [req.user?.name, req.user?.surname]
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean)
        .join(" ") ||
      normalizeEmail(req.user?.email) ||
      "Unknown user";
    const extraMessage =
      typeof req.body?.message === "string" ? req.body.message.trim() : "";

    const deviceText =
      alertType === "suspicious-device"
        ? "This notification has been marked as a suspicious device alert. If you did not initiate this change, please investigate immediately."
        : "Share this update when you're ready.";

    const durationSeconds = Number(podcast.audio.duration_seconds);
    let durationLabel = null;
    if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
      const minutes = Math.floor(durationSeconds / 60);
      let seconds = Math.round(durationSeconds % 60);
      let normalizedMinutes = minutes;
      if (seconds === 60) {
        normalizedMinutes += 1;
        seconds = 0;
      }
      const durationParts = [];
      if (normalizedMinutes) {
        durationParts.push(`${normalizedMinutes}m`);
      }
      if (seconds || !durationParts.length) {
        durationParts.push(`${seconds}s`);
      }
      durationLabel = durationParts.join(" ");
    }
    const fileSizeLabel = Number.isFinite(podcast.audio.file_size)
      ? `${(podcast.audio.file_size / (1024 * 1024)).toFixed(1)} MB`
      : null;

    const downloadUrl = podcast.audio.download_url || podcast.audio.url;

    const textSections = [
      "Hello, here some news.",
      `Episode: ${podcast.title}`,
      `Updated: ${formattedTimestamp}`,
      description ? `Summary: ${description}` : null,
      durationLabel ? `Duration: ${durationLabel}` : null,
      fileSizeLabel ? `File size: ${fileSizeLabel}` : null,
      downloadUrl ? `Audio: ${downloadUrl}` : null,
      extraMessage || null,
      deviceText,
      `Dashboard: ${dashboardUrl}`,
    ].filter(Boolean);

    const htmlSections = [];
    htmlSections.push(`<p>Hello, here some news.</p>`);
    htmlSections.push(`<p><strong>${escapeHtml(podcast.title)}</strong></p>`);
    if (description) {
      htmlSections.push(`<p>${escapeHtml(description)}</p>`);
    }
    htmlSections.push(
      `<p><strong>Updated:</strong> ${escapeHtml(formattedTimestamp)}</p>`
    );
    if (durationLabel || fileSizeLabel) {
      const metaParts = [
        durationLabel ? escapeHtml(durationLabel) : null,
        fileSizeLabel ? escapeHtml(fileSizeLabel) : null,
      ].filter(Boolean);
      if (metaParts.length) {
        htmlSections.push(
          `<p><strong>Details:</strong> ${metaParts.join(" • ")}</p>`
        );
      }
    }
    if (downloadUrl) {
      htmlSections.push(
        `<p><a href="${escapeHtml(
          downloadUrl
        )}" target="_blank" rel="noopener">Listen or download the episode</a></p>`
      );
    }
    if (extraMessage) {
      htmlSections.push(`<p>${escapeHtml(extraMessage)}</p>`);
    }
    htmlSections.push(`<p>${escapeHtml(deviceText)}</p>`);
    htmlSections.push(
      `<p><a href="${escapeHtml(
        dashboardUrl
      )}" target="_blank" rel="noopener">Open the dashboard</a></p>`
    );

    const mailResult = await sendMail({
      to: recipients,
      subject,
      text: textSections.join("\n\n"),
      html: htmlSections.join("\n"),
    });

    const podcasts = getCollection("dashboard_podcasts");
    const now = new Date();
    const notificationState = buildNotificationState({
      sent: true,
      sent_at: now,
      sent_by: triggeredBy,
      sent_by_email: normalizeEmail(req.user?.email) || null,
      sent_by_id: req.user?.id || null,
      recipient_count: recipients.length,
      subject,
    });

    await podcasts.updateOne(
      { _id: podcastDoc._id },
      {
        $set: {
          notification_state: notificationState,
          updated_at: now,
          updated_by: req.user?.id || null,
        },
      }
    );

    podcastDoc.notification_state = notificationState;
    podcastDoc.updated_at = now;
    podcastDoc.updated_by = req.user?.id || null;
    const formattedPodcast = formatPodcastDoc(podcastDoc, { req });

    res.json({
      success: true,
      podcast: {
        id: formattedPodcast.id,
        title: formattedPodcast.title,
        notification_state: formattedPodcast.notification_state,
      },
      sent_to: mailResult.to,
      cc: mailResult.cc || [],
      bcc: mailResult.bcc || [],
      message_id: mailResult.messageId || null,
      preview_url: mailResult.previewUrl || null,
      recipient_count: recipients.length,
    });
  } catch (err) {
    console.error("Failed to send podcast notification", err);
    const status =
      typeof err?.statusCode === "number" && err.statusCode >= 400
        ? err.statusCode
        : 500;
    res.status(status).json({
      error: "Failed to send podcast notification",
      details: err?.message || null,
      code: err?.code || null,
      response: err?.response || null,
    });
  }
});

router.get("/notes", async (req, res) => {
  try {
    const notes = getCollection("dashboard_notes");
    const result = await notes
      .find({})
      .sort({ updated_at: -1, created_at: -1 })
      .toArray();
    res.json({ notes: result.map(formatNoteDoc) });
  } catch (err) {
    console.error("Failed to load dashboard notes", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/notes", requireAdmin, async (req, res) => {
  try {
    const title =
      typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
    const author =
      typeof req.body?.author === "string" ? req.body.author.trim() : "";
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!body) {
      return res.status(400).json({ error: "Note content is required" });
    }

    const now = new Date();
    const doc = {
      title,
      body,
      author,
      tasks: sanitizeTasks(req.body?.tasks),
      created_at: now,
      updated_at: now,
      created_by: req.user?.id || null,
      updated_by: req.user?.id || null,
    };

    const notes = getCollection("dashboard_notes");
    const result = await notes.insertOne(doc);
    res
      .status(201)
      .json({ note: formatNoteDoc({ ...doc, _id: result.insertedId }) });
  } catch (err) {
    console.error("Failed to create dashboard note", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.put("/notes/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const update = {};

    if (req.body?.title !== undefined) {
      const title =
        typeof req.body.title === "string" ? req.body.title.trim() : "";
      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }
      update.title = title;
    }

    if (req.body?.body !== undefined) {
      const body =
        typeof req.body.body === "string" ? req.body.body.trim() : "";
      if (!body) {
        return res.status(400).json({ error: "Note content is required" });
      }
      update.body = body;
    }

    if (req.body?.author !== undefined) {
      update.author =
        typeof req.body.author === "string" ? req.body.author.trim() : "";
    }

    if (req.body?.tasks !== undefined) {
      update.tasks = sanitizeTasks(req.body.tasks);
    }

    if (!Object.keys(update).length) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    update.updated_at = new Date();
    update.updated_by = req.user?.id || null;

    const notes = getCollection("dashboard_notes");
    const objectId = toObjectId(id);
    const filters = [];
    if (objectId) {
      filters.push({ _id: objectId });
    }
    if (!objectId || objectId.toString() !== id) {
      filters.push({ _id: id });
    }

    let updatedDoc = null;
    for (const filter of filters) {
      const attempt = await notes.findOneAndUpdate(
        filter,
        { $set: update },
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

    res.json({ note: formatNoteDoc(updatedDoc) });
  } catch (err) {
    console.error("Failed to update dashboard note", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.delete("/notes/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const notes = getCollection("dashboard_notes");
    const objectId = toObjectId(id);
    const filters = [];
    if (objectId) {
      filters.push({ _id: objectId });
    }
    if (!objectId || objectId.toString() !== id) {
      filters.push({ _id: id });
    }

    let deleted = false;
    for (const filter of filters) {
      const result = await notes.deleteOne(filter);
      if (result.deletedCount > 0) {
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete dashboard note", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/codespaces", async (req, res) => {
  try {
    const codespaces = getCollection("dashboard_codespaces");
    const result = await codespaces
      .find({})
      .sort({ updated_at: -1, created_at: -1 })
      .toArray();
    res.json({ codespaces: result.map(formatCodespaceDoc) });
  } catch (err) {
    console.error("Failed to load dashboard codespaces", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/codespaces", requireAdmin, async (req, res) => {
  try {
    const payload = sanitizeCodespacePayload(req.body || {});
    if (!payload.project) {
      return res.status(400).json({ error: "Project name is required" });
    }
    if (!payload.repository) {
      return res.status(400).json({ error: "Repository is required" });
    }
    if (!payload.repository.includes("/")) {
      return res
        .status(400)
        .json({ error: "Repository must be in owner/repo format" });
    }

    const now = new Date();
    const doc = {
      ...payload,
      created_at: now,
      updated_at: now,
      created_by: req.user?.id || null,
      updated_by: req.user?.id || null,
    };

    const codespaces = getCollection("dashboard_codespaces");
    const result = await codespaces.insertOne(doc);
    res.status(201).json({
      codespace: formatCodespaceDoc({ ...doc, _id: result.insertedId }),
    });
  } catch (err) {
    console.error("Failed to create dashboard codespace", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.put("/codespaces/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updatePayload = sanitizeCodespacePayload(req.body || {});
    const update = {};

    if (req.body?.project !== undefined) {
      if (!updatePayload.project) {
        return res.status(400).json({ error: "Project name is required" });
      }
      update.project = updatePayload.project;
    }

    if (req.body?.repository !== undefined) {
      if (!updatePayload.repository) {
        return res.status(400).json({ error: "Repository is required" });
      }
      if (!updatePayload.repository.includes("/")) {
        return res
          .status(400)
          .json({ error: "Repository must be in owner/repo format" });
      }
      update.repository = updatePayload.repository;
    }

    if (req.body?.branch !== undefined) update.branch = updatePayload.branch;
    if (req.body?.status !== undefined) update.status = updatePayload.status;
    if (req.body?.region !== undefined) update.region = updatePayload.region;
    if (req.body?.description !== undefined)
      update.description = updatePayload.description;
    if (req.body?.url !== undefined) update.url = updatePayload.url;
    if (req.body?.repo_url !== undefined)
      update.repo_url = updatePayload.repo_url;
    if (req.body?.editor !== undefined) update.editor = updatePayload.editor;

    if (!Object.keys(update).length) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    update.updated_at = new Date();
    update.updated_by = req.user?.id || null;

    const codespaces = getCollection("dashboard_codespaces");
    const objectId = toObjectId(id);
    const filters = [];
    if (objectId) filters.push({ _id: objectId });
    if (!objectId || objectId.toString() !== id) filters.push({ _id: id });

    let updatedDoc = null;
    for (const filter of filters) {
      const attempt = await codespaces.findOneAndUpdate(
        filter,
        { $set: update },
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

    res.json({ codespace: formatCodespaceDoc(updatedDoc) });
  } catch (err) {
    console.error("Failed to update dashboard codespace", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.delete("/codespaces/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const codespaces = getCollection("dashboard_codespaces");
    const objectId = toObjectId(id);
    const filters = [];
    if (objectId) filters.push({ _id: objectId });
    if (!objectId || objectId.toString() !== id) filters.push({ _id: id });

    let deleted = false;
    for (const filter of filters) {
      const result = await codespaces.deleteOne(filter);
      if (result.deletedCount > 0) {
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete dashboard codespace", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
