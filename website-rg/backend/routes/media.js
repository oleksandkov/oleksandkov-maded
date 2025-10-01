import express from "express";
import { Readable } from "stream";
import { getObjectStream } from "../utils/storage.js";
import { userMessage } from "../utils/userMessages.js";

const router = express.Router();

async function pipeBodyToResponse(body, res) {
  if (!body) {
    throw new Error("Empty body stream");
  }

  if (typeof body.pipe === "function") {
    body.pipe(res);
    return;
  }

  if (typeof body.transformToWebStream === "function") {
    const webStream = body.transformToWebStream();
    Readable.fromWeb(webStream).pipe(res);
    return;
  }

  if (typeof body.arrayBuffer === "function") {
    const buffer = Buffer.from(await body.arrayBuffer());
    res.end(buffer);
    return;
  }

  if (Buffer.isBuffer(body)) {
    res.end(body);
    return;
  }

  throw new Error("Unsupported body stream type");
}

function buildFilename(key, metadata = {}) {
  if (metadata && typeof metadata["original-name"] === "string") {
    return metadata["original-name"];
  }
  const segments = String(key).split("/");
  return segments[segments.length - 1] || "download";
}

router.get("/", async (req, res) => {
  const keyRaw = typeof req.query.key === "string" ? req.query.key : "";
  const key = keyRaw.trim();
  if (!key) {
    return res.status(400).json({ error: userMessage("storageKeyRequired") });
  }

  const wantDownload =
    req.query.download === "1" ||
    req.query.download === "true" ||
    req.query.download === "download";

  try {
    const result = await getObjectStream(key);

    res.setHeader("Content-Type", result.contentType);
    if (result.contentLength) {
      res.setHeader("Content-Length", result.contentLength);
    }
    if (result.cacheControl) {
      res.setHeader("Cache-Control", result.cacheControl);
    } else {
      res.setHeader(
        "Cache-Control",
        "public, max-age=900, stale-while-revalidate=300"
      );
    }
    if (result.etag) {
      res.setHeader("ETag", result.etag);
    }
    if (result.lastModified) {
      res.setHeader(
        "Last-Modified",
        new Date(result.lastModified).toUTCString()
      );
    }

    const filename = buildFilename(key, result.metadata);
    if (wantDownload) {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(filename)}"`
      );
    } else {
      res.setHeader("Content-Disposition", "inline");
    }

    try {
      await pipeBodyToResponse(result.body, res);
    } catch (streamError) {
      console.error("Media stream error", streamError);
      if (!res.headersSent) {
        res.status(500).json({ error: userMessage("mediaStreamFailed") });
      } else {
        res.end();
      }
    }
  } catch (error) {
    const statusCode = error?.$metadata?.httpStatusCode;
    if (statusCode === 404 || error?.name === "NoSuchKey") {
      return res.status(404).json({ error: userMessage("notFound") });
    }
    console.error("Failed to proxy media", error);
    res.status(500).json({ error: userMessage("mediaStreamFailed") });
  }
});

export default router;
