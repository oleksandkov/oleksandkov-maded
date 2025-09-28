import nodemailer from "nodemailer";

let transporterPromise = null;

function normalizeBoolean(value, fallback = false) {
  if (value == null) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function normalizeRecipients(recipients) {
  if (!recipients) return [];
  const toArray = Array.isArray(recipients)
    ? recipients
    : String(recipients).split(/[,;]+/);

  return toArray
    .map((value) => (value == null ? "" : String(value).trim()))
    .filter(Boolean);
}

function extractAddressKey(value) {
  if (!value) return "";
  const stringValue = String(value).trim();
  if (!stringValue) return "";
  const match = stringValue.match(/<([^>]+)>/);
  const address = match ? match[1] : stringValue;
  return address.trim().toLowerCase();
}

function buildRecipientLists(input) {
  const seen = new Set();
  const toList = [];
  const ccList = [];
  const bccList = [];

  const add = (address, bucket) => {
    const trimmed = String(address || "").trim();
    if (!trimmed) return;
    const key = extractAddressKey(trimmed);
    if (!key || seen.has(key)) return;
    seen.add(key);
    bucket.push(trimmed);
  };

  normalizeRecipients(input?.to).forEach((value) => add(value, toList));
  normalizeRecipients(input?.cc).forEach((value) => add(value, ccList));
  normalizeRecipients(input?.bcc).forEach((value) => add(value, bccList));

  return { toList, ccList, bccList };
}

function formatSenderAddress(address) {
  if (!address) return null;
  const trimmed = String(address).trim();
  if (!trimmed) return null;
  if (trimmed.includes("<")) {
    return trimmed;
  }
  const displayName = String(process.env.MAIL_NAME || "").trim();
  return displayName ? `${displayName} <${trimmed}>` : trimmed;
}

function formatReplyToAddress(address) {
  if (!address) return null;
  const trimmed = String(address).trim();
  if (!trimmed) return null;
  return trimmed.includes("<") ? trimmed : trimmed;
}

export function isMailConfigured() {
  return Boolean(
    (process.env.SMTP_SERVICE || process.env.SMTP_HOST) &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

function createTransporter() {
  if (!isMailConfigured()) {
    throw new Error("Email service is not configured");
  }

  const service = process.env.SMTP_SERVICE;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const usePool = normalizeBoolean(process.env.SMTP_POOL, false);
  const logger = normalizeBoolean(process.env.SMTP_LOGGER, false);
  const debug = normalizeBoolean(process.env.SMTP_DEBUG, false);
  const rejectUnauthorized = normalizeBoolean(
    process.env.SMTP_TLS_REJECT_UNAUTHORIZED,
    true
  );

  if (!user || !pass) {
    throw new Error(
      "SMTP credentials are not configured. Set SMTP_USER and SMTP_PASS."
    );
  }

  const maxConnections = Number.parseInt(
    process.env.SMTP_MAX_CONNECTIONS || "5",
    10
  );
  const maxMessages = Number.parseInt(
    process.env.SMTP_MAX_MESSAGES || "100",
    10
  );

  const transporterConfig = {
    pool: usePool,
    logger,
    debug,
    auth: {
      user,
      pass,
    },
  };

  if (service) {
    transporterConfig.service = service;
  }

  const host = process.env.SMTP_HOST;
  if (host) {
    transporterConfig.host = host;
  }

  const portEnv = process.env.SMTP_PORT;
  if (portEnv) {
    transporterConfig.port = Number.parseInt(portEnv, 10);
  } else if (!transporterConfig.port) {
    transporterConfig.port = service ? undefined : 587;
  }

  const secureEnv = process.env.SMTP_SECURE;
  if (secureEnv != null) {
    transporterConfig.secure = normalizeBoolean(
      secureEnv,
      transporterConfig.port === 465
    );
  } else if (
    transporterConfig.port != null &&
    transporterConfig.secure == null
  ) {
    transporterConfig.secure = transporterConfig.port === 465;
  }

  if (usePool) {
    if (Number.isFinite(maxConnections)) {
      transporterConfig.maxConnections = maxConnections;
    }
    if (Number.isFinite(maxMessages)) {
      transporterConfig.maxMessages = maxMessages;
    }
  }

  if (!rejectUnauthorized) {
    transporterConfig.tls = { rejectUnauthorized: false };
  }

  return nodemailer.createTransport(transporterConfig);
}

async function ensureTransporter() {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      const transporter = createTransporter();
      const shouldVerify = normalizeBoolean(
        process.env.SMTP_VERIFY_CONNECTION,
        process.env.NODE_ENV !== "production"
      );
      if (shouldVerify) {
        await transporter.verify();
      }
      return transporter;
    })();
  }

  return transporterPromise;
}

export async function sendMail({
  to,
  subject,
  text,
  html,
  from,
  cc,
  bcc,
  replyTo,
  attachments,
  headers,
} = {}) {
  if (!isMailConfigured()) {
    throw new Error("Email service is not configured");
  }

  const transporter = await ensureTransporter();
  const { toList, ccList, bccList } = buildRecipientLists({ to, cc, bcc });

  if (!toList.length) {
    throw new Error("No recipients provided");
  }

  const fromSource = process.env.MAIL_FROM || process.env.SMTP_USER;
  const formattedFrom = formatSenderAddress(fromSource);
  if (!formattedFrom) {
    throw new Error(
      "No sender address configured. Set MAIL_FROM or provide SMTP_USER."
    );
  }

  const formattedReplyTo = formatReplyToAddress(replyTo);
  const finalSubject = typeof subject === "string" ? subject.trim() : "";

  const message = {
    from: formattedFrom,
    to: toList,
    subject: finalSubject,
  };

  if (typeof text === "string" && text.length > 0) {
    message.text = text;
  }

  if (typeof html === "string" && html.length > 0) {
    message.html = html;
  }

  if (ccList.length) {
    message.cc = ccList;
  }

  if (bccList.length) {
    message.bcc = bccList;
  }

  if (formattedReplyTo) {
    message.replyTo = formattedReplyTo;
  }

  if (Array.isArray(attachments) && attachments.length) {
    message.attachments = attachments;
  }

  if (headers && typeof headers === "object") {
    message.headers = headers;
  }

  let info;
  try {
    info = await transporter.sendMail(message);
  } catch (error) {
    const enhancedError = new Error(
      `Email dispatch failed: ${error?.message || "Unknown error"}`
    );
    if (typeof error?.responseCode === "number") {
      enhancedError.statusCode = error.responseCode;
    }
    if (error?.code) {
      enhancedError.code = error.code;
    }
    if (error?.response) {
      enhancedError.response = error.response;
    }
    enhancedError.cause = error;
    throw enhancedError;
  }
  const previewUrl = nodemailer.getTestMessageUrl
    ? nodemailer.getTestMessageUrl(info)
    : null;

  const shouldLog = normalizeBoolean(
    process.env.MAIL_DEBUG_LOG,
    process.env.NODE_ENV !== "production"
  );

  if (shouldLog) {
    const accepted = Array.isArray(info.accepted) ? info.accepted : [];
    console.info(
      `[mailer] Email dispatched to ${accepted.join(", ") || toList.join(", ")}`
    );
  }

  return {
    messageId: info.messageId,
    envelopeFrom: info.envelope?.from || message.from,
    envelopeTo: info.envelope?.to || [...toList, ...ccList, ...bccList],
    accepted: Array.isArray(info.accepted) ? info.accepted : [],
    rejected: Array.isArray(info.rejected) ? info.rejected : [],
    pending: Array.isArray(info.pending) ? info.pending : [],
    response: info.response,
    from: message.from,
    to: toList,
    cc: ccList,
    bcc: bccList,
    replyTo: formattedReplyTo || null,
    previewUrl,
  };
}

export async function verifyMailer() {
  if (!isMailConfigured()) {
    return false;
  }

  const transporter = await ensureTransporter();
  await transporter.verify();
  return true;
}
