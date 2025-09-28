import crypto from "crypto";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const REQUIRED_ENV_VARS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_BASE_URL",
];

let cachedClient = null;
let cachedConfig = null;

function normalizeDirectorySegment(value) {
  return value ? value.trim().replace(/^\/+/, "").replace(/\/+$/, "") : "";
}

function ensureConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
  if (missing.length) {
    const error = new Error(
      `Cloudflare R2 is not configured. Missing environment variables: ${missing.join(
        ", "
      )}`
    );
    error.code = "R2_NOT_CONFIGURED";
    error.statusCode = 503;
    error.missing = missing;
    throw error;
  }

  const accountId = process.env.R2_ACCOUNT_ID.trim();
  const endpoint = (process.env.R2_ENDPOINT || ``).trim();
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL.trim();

  cachedConfig = {
    accountId,
    region: process.env.R2_REGION?.trim() || "auto",
    bucket: process.env.R2_BUCKET_NAME.trim(),
    prefix: normalizeDirectorySegment(process.env.R2_PREFIX || ""),
    endpoint: endpoint || `https://${accountId}.r2.cloudflarestorage.com`,
    accessKeyId: process.env.R2_ACCESS_KEY_ID.trim(),
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY.trim(),
    publicBaseUrl: publicBaseUrl.replace(/\/+$/, ""),
  };

  return cachedConfig;
}

function getClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const { region, endpoint, accessKeyId, secretAccessKey } = ensureConfig();
  cachedClient = new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return cachedClient;
}

export function ensureR2Configured() {
  ensureConfig();
  return true;
}

export function decodeUploadFilename(originalName) {
  if (!originalName) return "";
  try {
    return Buffer.from(originalName, "latin1").toString("utf8");
  } catch (error) {
    return originalName;
  }
}

function sanitizeFilename(name) {
  if (!name) return "upload";
  const base = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "upload";
}

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }

  const entries = Object.entries(metadata).reduce((acc, [key, value]) => {
    const safeKey = typeof key === "string" ? key.trim() : "";
    if (!safeKey) {
      return acc;
    }

    if (value == null) {
      return acc;
    }

    const raw = typeof value === "string" ? value : String(value);
    const normalized = raw
      .replace(/[\r\n]+/g, " ")
      .replace(/[^\x20-\x7E]+/g, "?")
      .trim();

    if (!normalized) {
      return acc;
    }

    acc[safeKey] = normalized.slice(0, 1024);
    return acc;
  }, {});

  return Object.keys(entries).length ? entries : undefined;
}

export function generateStorageKey({ directory = "", originalName = "" } = {}) {
  const config = ensureConfig();
  const sanitizedDirSegments = [
    config.prefix,
    normalizeDirectorySegment(directory),
  ]
    .filter(Boolean)
    .join("/");
  const decodedName = decodeUploadFilename(originalName);
  const sanitizedName = sanitizeFilename(decodedName);
  const extension = path.extname(sanitizedName) || "";
  const uniqueToken =
    crypto.randomUUID?.() || crypto.randomBytes(8).toString("hex");
  const timestamp = Date.now();
  const filename = `${timestamp}-${uniqueToken}${extension}`;
  return [sanitizedDirSegments, filename].filter(Boolean).join("/");
}

export function buildPublicUrl(key) {
  if (!key) {
    throw new Error("Storage key is required to build public URL");
  }

  const { publicBaseUrl, bucket } = ensureConfig();
  const parsed = new URL(publicBaseUrl);
  const normalizedKey = String(key).replace(/^\/+/, "");
  let pathname = parsed.pathname.replace(/\/+$/, "");

  const hostname = parsed.hostname.toLowerCase();
  const needsBucketPath = /\.r2\.cloudflarestorage\.com$/i.test(hostname);
  const bucketSegment = String(bucket || "").trim();

  if (needsBucketPath && bucketSegment) {
    const bucketPattern = new RegExp(
      `(?:^|/)${bucketSegment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(/|$)`,
      "i"
    );

    if (!bucketPattern.test(pathname)) {
      pathname = `${pathname}/${bucketSegment}`.replace(/\/{2,}/g, "/");
    }
  }

  const normalizedPath = pathname ? `${pathname.replace(/\/+$/, "")}/` : "/";
  return `${parsed.origin}${normalizedPath}${normalizedKey}`;
}

export function buildMediaProxyPath(key, options = {}) {
  if (!key) {
    return null;
  }

  const params = new URLSearchParams();
  params.set("key", String(key));

  if (options.download) {
    params.set("download", "1");
  }

  return `/api/media?${params.toString()}`;
}

export async function uploadBufferToR2({
  key,
  buffer,
  contentType,
  cacheControl,
  metadata,
}) {
  if (!key) {
    throw new Error("Storage key is required for R2 upload");
  }
  if (!buffer) {
    throw new Error("Buffer is required for R2 upload");
  }

  const { bucket } = ensureConfig();
  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType || "application/octet-stream",
    CacheControl: cacheControl,
    Metadata: sanitizeMetadata(metadata),
  });

  await client.send(command);

  return {
    key,
    bucket,
    url: buildPublicUrl(key),
  };
}

export async function deleteFromR2(key) {
  if (!key) return;
  const { bucket } = ensureConfig();
  const client = getClient();
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  try {
    await client.send(command);
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404) {
      return;
    }
    throw error;
  }
}

export async function getObjectStream(key) {
  if (!key) {
    throw new Error("Storage key is required to download object");
  }

  const { bucket } = ensureConfig();
  const client = getClient();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await client.send(command);

  return {
    body: response.Body,
    contentType: response.ContentType || "application/octet-stream",
    contentLength: Number(response.ContentLength) || undefined,
    lastModified: response.LastModified || null,
    cacheControl: response.CacheControl || null,
    etag: response.ETag || null,
    metadata: response.Metadata || {},
  };
}
