import express from "express";
import { isMailConfigured, sendMail } from "../utils/mailer.js";
import { userMessage } from "../utils/userMessages.js";
import { listTeamMemberEmails } from "../utils/teamDirectory.js";

const router = express.Router();

function normalizeString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeEmail(value) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseRecipientList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(normalizeEmail).filter(Boolean);
  }
  return String(value)
    .split(/[,;\s]+/)
    .map(normalizeEmail)
    .filter(Boolean);
}

function dedupeEmails(values = []) {
  const seen = new Set();
  const result = [];
  values.forEach((email) => {
    const normalized = normalizeEmail(email);
    if (!normalized || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    result.push(email);
  });
  return result;
}

function resolveContactRecipients() {
  const envCandidates = [
    process.env.CONTACT_FORM_RECIPIENTS,
    process.env.CONTACT_RECIPIENTS,
    process.env.CONTACT_EMAIL,
    process.env.SUPPORT_EMAIL,
  ];

  const recipients = dedupeEmails(
    envCandidates.flatMap((value) => parseRecipientList(value))
  );

  if (recipients.length) {
    return recipients;
  }

  const fallback = dedupeEmails(listTeamMemberEmails());
  if (fallback.length) {
    return fallback;
  }

  const smtpUser = normalizeEmail(
    process.env.MAIL_FROM || process.env.SMTP_USER
  );
  return smtpUser ? [smtpUser] : [];
}

function formatEmailBody({ name, email, subject, message, submittedAt }) {
  const submittedLabel = submittedAt.toISOString();
  const safeMessage = escapeHtml(message || "");
  const safeName = escapeHtml(name || "");
  const safeEmail = escapeHtml(email || "");
  const lines = [
    "New contact form submission received.",
    `Submitted at: ${submittedLabel}`,
    name ? `Name: ${name}` : null,
    email ? `Email: ${email}` : null,
    "",
    message,
  ].filter(Boolean);

  const text = lines.join("\n");

  const html = `
    <p><strong>New contact form submission received.</strong></p>
    <ul>
      <li><strong>Submitted at:</strong> ${submittedLabel}</li>
      ${name ? `<li><strong>Name:</strong> ${safeName}</li>` : ""}
      ${email ? `<li><strong>Email:</strong> ${safeEmail}</li>` : ""}
    </ul>
    <p><strong>Message:</strong></p>
    <blockquote>${safeMessage.replace(/\n/g, "<br>")}</blockquote>
  `;

  return { text, html };
}

function isLikelyEmail(value) {
  if (typeof value !== "string") return false;
  const normalized = value.trim();
  if (!normalized) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

router.post("/", async (req, res) => {
  if (!isMailConfigured()) {
    return res.status(503).json({
      error: userMessage("emailServiceUnavailable"),
    });
  }

  const name = normalizeString(req.body?.name);
  const email = normalizeString(req.body?.email);
  const subject = normalizeString(req.body?.subject);
  const message = normalizeString(req.body?.message);

  if (!subject) {
    return res
      .status(400)
      .json({ error: userMessage("contactSubjectMissing") });
  }

  if (!message) {
    return res
      .status(400)
      .json({ error: userMessage("contactMessageMissing") });
  }

  if (!email || !isLikelyEmail(email)) {
    return res.status(400).json({ error: userMessage("contactEmailInvalid") });
  }

  const recipients = resolveContactRecipients();
  if (!recipients.length) {
    return res.status(503).json({
      error: userMessage("contactRecipientsMissing"),
    });
  }

  const safeSubject = subject.startsWith("Website contact:")
    ? subject
    : `Website contact: ${subject}`;

  const { text, html } = formatEmailBody({
    name,
    email,
    subject,
    message,
    submittedAt: new Date(),
  });

  try {
    const mailResult = await sendMail({
      to: recipients,
      subject: safeSubject,
      text,
      html,
      replyTo: email,
      headers: {
        "X-Entity": "contact-form-message",
      },
    });

    res.json({
      success: true,
      sent_to: mailResult.to,
      message_id: mailResult.messageId || null,
    });
  } catch (error) {
    console.error("Contact form email failed", error);
    const status =
      typeof error?.statusCode === "number" && error.statusCode >= 400
        ? error.statusCode
        : 500;
    res.status(status).json({
      error: userMessage("contactSendFailed"),
      details: error?.message || null,
    });
  }
});

export default router;
