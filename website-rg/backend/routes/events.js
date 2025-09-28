import express from "express";
import jwt from "jsonwebtoken";
import { getCollection, toObjectId } from "../db.js";
import { normalizeTeamMembers } from "../utils/teamMembers.js";
import { getContactsForMembers } from "../utils/teamDirectory.js";
import { isMailConfigured, sendMail } from "../utils/mailer.js";
import { buildEventEmailTemplate } from "../utils/eventTemplate.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function normalizeBoolean(value, fallback = false) {
  if (value == null) return fallback;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function normalizeEmail(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function extractEmailKey(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/<([^>]+)>/);
  const address = match ? match[1] : trimmed;
  return address.trim().toLowerCase();
}

function dedupeEmails(values = []) {
  const seen = new Set();
  const result = [];
  for (const raw of values) {
    const email = normalizeEmail(raw);
    if (!email) continue;
    const key = extractEmailKey(email);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(email);
  }
  return result;
}

function composeSenderAddress(user) {
  if (!user) return null;
  const email = normalizeEmail(user.email);
  if (!email) return null;

  const nameParts = [user.name, user.surname]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  if (!nameParts.length) {
    return email;
  }

  return `${nameParts.join(" ")} <${email}>`;
}

function normalizeDurationMinutes(value, fallback = 60) {
  if (value == null || value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, 24 * 60);
}

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

function formatEventDoc(doc) {
  if (!doc) return doc;
  const { _id, team_members, start_at, duration_minutes, ...rest } = doc;
  let duration = null;
  if (duration_minutes != null && duration_minutes !== "") {
    const parsed = Number.parseInt(duration_minutes, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      duration = Math.min(parsed, 24 * 60);
    }
  }
  return {
    id: _id.toString(),
    ...rest,
    start_at: start_at ? new Date(start_at).toISOString() : null,
    duration_minutes: duration,
    team_members: normalizeTeamMembers(team_members),
  };
}

async function findEventDocument(id) {
  const events = getCollection("events");
  const eventId = toObjectId(id);
  const filters = [];

  if (eventId) {
    filters.push({ _id: eventId });
  }

  if (!eventId || eventId.toString() !== id) {
    filters.push({ _id: id });
  }

  for (const filter of filters) {
    const doc = await events.findOne(filter);
    if (doc) {
      return doc;
    }
  }

  return null;
}

router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const events = getCollection("events");
    const result = await events
      .find({})
      .sort({ start_at: 1, created_at: -1 })
      .toArray();
    res.json({ events: result.map(formatEventDoc) });
  } catch (err) {
    console.error("Failed to load events", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      start_at,
      location,
      team_members,
      duration_minutes,
    } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!start_at) {
      return res.status(400).json({ error: "Start date and time required" });
    }

    const startDate = new Date(start_at);
    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({ error: "Invalid start date" });
    }

    const durationMinutes = normalizeDurationMinutes(duration_minutes, 60);

    const normalizedTeam = normalizeTeamMembers(team_members);
    const now = new Date();

    const events = getCollection("events");
    const doc = {
      title,
      description: description || "",
      start_at: startDate,
      location: location || "",
      team_members: normalizedTeam,
      duration_minutes: durationMinutes,
      created_at: now,
      updated_at: now,
      created_by: req.user?.id || null,
    };

    const result = await events.insertOne(doc);
    res
      .status(201)
      .json({ event: formatEventDoc({ ...doc, _id: result.insertedId }) });
  } catch (err) {
    console.error("Event creation failed", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const eventId = toObjectId(id);
    const events = getCollection("events");

    const filters = [];
    if (eventId) {
      filters.push({ _id: eventId });
    }
    if (!eventId || eventId.toString() !== id) {
      filters.push({ _id: id });
    }

    let deleted = false;
    for (const filter of filters) {
      const result = await events.deleteOne(filter);
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
    console.error("Failed to delete event", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/:id/send", requireAuth, requireAdmin, async (req, res) => {
  if (!isMailConfigured()) {
    return res.status(503).json({
      error:
        "Email service is not configured. Please set SMTP_HOST and MAIL_FROM environment variables.",
    });
  }

  try {
    const { id } = req.params;
    const doc = await findEventDocument(id);

    if (!doc) {
      return res.status(404).json({ error: "Event not found" });
    }

    const event = formatEventDoc(doc);
    const { contacts, missing } = getContactsForMembers(event.team_members);

    const extraRecipientsRaw = req.body?.extraRecipients;
    const extraRecipients = Array.isArray(extraRecipientsRaw)
      ? extraRecipientsRaw
      : extraRecipientsRaw
      ? String(extraRecipientsRaw).split(/[,;]+/)
      : [];

    const includeSender = normalizeBoolean(req.body?.includeSender, false);
    const senderEmail = normalizeEmail(req.user?.email);
    const senderAddress = composeSenderAddress(req.user);

    const candidateRecipients = [
      ...contacts.map((contact) => contact.email),
      ...extraRecipients,
    ];

    if (includeSender && senderEmail) {
      candidateRecipients.push(senderEmail);
    }

    const uniqueRecipients = dedupeEmails(candidateRecipients);

    if (!uniqueRecipients.length) {
      return res
        .status(400)
        .json({ error: "No email addresses found for this event" });
    }

    const finalSubject = req.body?.subject?.trim()
      ? req.body.subject.trim()
      : `Invitation: ${event.title}`;

    const rawMessage =
      typeof req.body?.message === "string" ? req.body.message : "";
    const { text: emailText, html: emailHtml } = buildEventEmailTemplate(
      event,
      contacts,
      { extraMessage: rawMessage.trim() }
    );

    const explicitFromRaw =
      typeof req.body?.from === "string" ? req.body.from.trim() : "";
    const effectiveFrom = senderAddress || explicitFromRaw || undefined;
    const finalReplyTo =
      normalizeEmail(req.body?.replyTo) || senderEmail || undefined;

    const ccInput = req.body?.cc;
    const bccInput = req.body?.bcc;

    const mailResult = await sendMail({
      from: effectiveFrom,
      to: uniqueRecipients,
      subject: finalSubject,
      text: emailText,
      html: emailHtml,
      cc: ccInput,
      bcc: bccInput,
      replyTo: finalReplyTo,
    });

    res.json({
      success: true,
      event: { id: event.id, title: event.title },
      from: mailResult.from,
      sent_to: mailResult.to?.length ? mailResult.to : uniqueRecipients,
      cc: mailResult.cc || [],
      bcc: mailResult.bcc || [],
      message_id: mailResult.messageId || null,
      envelope_from: mailResult.envelopeFrom || mailResult.from || null,
      envelope_to:
        mailResult.envelopeTo && mailResult.envelopeTo.length
          ? mailResult.envelopeTo
          : mailResult.to || uniqueRecipients,
      accepted: mailResult.accepted || [],
      rejected: mailResult.rejected || [],
      pending: mailResult.pending || [],
      preview_url: mailResult.previewUrl || null,
      reply_to: mailResult.replyTo || finalReplyTo || null,
      missing,
      copied_sender: includeSender && Boolean(senderEmail),
    });
  } catch (err) {
    console.error("Failed to send event invites", err);
    const status =
      typeof err?.statusCode === "number" && err.statusCode >= 400
        ? err.statusCode
        : 500;
    res.status(status).json({
      error: "Failed to send event invites",
      details: err?.message || null,
      code: err?.code || null,
      response: err?.response || null,
    });
  }
});

export default router;
