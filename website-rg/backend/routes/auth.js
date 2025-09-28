import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { getCollection, toObjectId } from "../db.js";
import { sendMail, isMailConfigured } from "../utils/mailer.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const USERS_COLLECTION = "users";
const GUEST_COLLECTION = "users_guest";

const EMAIL_VERIFICATION_TTL_HOURS = Math.max(
  1,
  Number.parseInt(process.env.EMAIL_VERIFICATION_TTL_HOURS || "48", 10)
);

const EMAIL_VERIFICATION_RESEND_INTERVAL_MINUTES = Math.max(
  1,
  Number.parseInt(
    process.env.EMAIL_VERIFICATION_RESEND_INTERVAL_MINUTES || "2",
    10
  )
);

function escapeHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getGuestDisplayName(guest = {}) {
  const full = guest.full_name;
  if (full && full.trim().length) return full.trim();
  const composed = [guest.name, guest.surname]
    .filter((part) => part && String(part).trim().length)
    .join(" ");
  if (composed.trim().length) return composed.trim();
  if (guest.email && String(guest.email).trim().length) {
    return String(guest.email).trim();
  }
  return "there";
}

function buildApplicationBaseUrl(req) {
  const configured = String(process.env.APP_BASE_URL || "").trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const forwardedProto = req.headers["x-forwarded-proto"];
  const protoSource = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : typeof forwardedProto === "string"
    ? forwardedProto.split(",")[0]
    : null;
  const protocol = (protoSource || req.protocol || "http").trim();
  const host =
    req.get("x-forwarded-host") || req.get("host") || "localhost:4010";
  return `${protocol}://${host}`.replace(/\/$/, "");
}

function buildGuestVerificationUrl(req, token, email) {
  const base = buildApplicationBaseUrl(req);
  const params = new URLSearchParams({ token });
  if (email) {
    params.append("email", email);
  }
  return `${base}/verify.html?${params.toString()}`;
}

function formatHoursLabel(hours) {
  if (hours === 1) return "1 hour";
  return `${hours} hours`;
}

function formatMinutesLabel(minutes) {
  if (minutes <= 0) return "a moment";
  if (minutes === 1) return "1 minute";
  if (minutes % 60 === 0) {
    return formatHoursLabel(minutes / 60);
  }
  return `${minutes} minutes`;
}

async function dispatchGuestVerificationEmail({ req, guest, token }) {
  if (!isMailConfigured()) {
    throw new Error("Email service is not configured");
  }

  const normalizedEmail = normalizeEmail(guest.email);
  const verificationUrl = buildGuestVerificationUrl(
    req,
    token,
    normalizedEmail
  );
  const displayName = getGuestDisplayName(guest);
  const expiryLabel = formatHoursLabel(EMAIL_VERIFICATION_TTL_HOURS);
  const subject = "Confirm your Small Company guest account";
  const safeName = escapeHtml(displayName);
  const safeUrl = escapeHtml(verificationUrl);
  const safeEmail = normalizedEmail ? escapeHtml(normalizedEmail) : null;

  const html = `
    <p>Hi ${safeName},</p>
    <p>Thanks for joining the Small Company guest community. Please confirm your email address to activate your account.</p>
    <p style="margin:24px 0;">
      <a href="${safeUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Verify email</a>
    </p>
    ${
      safeEmail
        ? `<p>Your account email: <strong>${safeEmail}</strong></p>`
        : ""
    }
    <p>This link will expire in ${escapeHtml(
      expiryLabel
    )}. If the button doesn't work, copy and paste the link below into your browser:</p>
    <p><a href="${safeUrl}">${safeUrl}</a></p>
    <p>If you need a fresh link later, you can request another one from the login or verification page.</p>
    <p>If you didn't request this, you can safely ignore this email.</p>
    <p>— Small Company</p>
  `;

  const text =
    `Hi ${displayName},\n\n` +
    `Thanks for joining the Small Company guest community. Please confirm your email address to activate your account.\n\n` +
    `Verify your email: ${verificationUrl}\n\n` +
    (normalizedEmail ? `Account email: ${normalizedEmail}\n\n` : "") +
    `This link will expire in ${expiryLabel}. If you didn't request this, you can ignore this message.\n\n` +
    `— Small Company`;

  await sendMail({
    to: guest.email,
    subject,
    html,
    text,
    headers: {
      "X-Entity": "guest-email-verification",
    },
  });

  return verificationUrl;
}

function shouldResendVerification(guest, now = new Date()) {
  if (!guest) return false;
  const lastSentRaw = guest.verification_sent_at;
  if (!lastSentRaw) return true;
  const lastSent = new Date(lastSentRaw);
  if (Number.isNaN(lastSent.getTime())) return true;
  const intervalMs = EMAIL_VERIFICATION_RESEND_INTERVAL_MINUTES * 60 * 1000;
  return now.getTime() - lastSent.getTime() >= intervalMs;
}

function normalizeEmail(value) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function normalizeName(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
}

function composeFullName(name, surname) {
  return [name, surname].filter((val) => val && val.length).join(" ") || null;
}

function normalizePermissions(list) {
  if (!Array.isArray(list)) return [];
  const normalized = list
    .map((value) =>
      typeof value === "string" ? value.trim().toLowerCase() : ""
    )
    .filter(Boolean);
  return Array.from(new Set(normalized));
}

function parseNotificationPreference(value, fallback = false) {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return fallback;
}

router.post("/register", async (req, res) => {
  try {
    const { email, password, role, name, surname } = req.body;
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password)
      return res.status(400).json({ error: "Email and password required" });

    const passwordHash = bcrypt.hashSync(password, 10);
    const roleInput = typeof role === "string" ? role.trim().toLowerCase() : "";
    const roleValue = roleInput === "member" ? "member" : "admin";
    const firstName = normalizeName(name);
    const lastName = normalizeName(surname);
    const now = new Date();

    const users = getCollection(USERS_COLLECTION);
    const guests = getCollection(GUEST_COLLECTION);
    const permissions = normalizePermissions(req.body?.permissions || []);

    const [existingUser, existingGuest] = await Promise.all([
      users.findOne({ email: normalizedEmail }),
      guests.findOne({ email: normalizedEmail }),
    ]);

    if (existingUser || existingGuest) {
      return res.status(400).json({ error: "User already exists" });
    }

    const result = await users.insertOne({
      email: normalizedEmail,
      password_hash: passwordHash,
      role: roleValue,
      name: firstName || null,
      surname: lastName || null,
      full_name: composeFullName(firstName, lastName),
      permissions,
      notification_opt_in: false,
      created_at: now,
    });

    res.status(201).json({
      id: result.insertedId.toString(),
      email: normalizedEmail,
      role: roleValue,
      name: firstName || null,
      surname: lastName || null,
      full_name: composeFullName(firstName, lastName),
      permissions,
      notification_opt_in: false,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ error: "User already exists" });
    }
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/register/guest", async (req, res) => {
  try {
    const { name, surname, email, password } = req.body;
    const firstName = normalizeName(name);
    const lastName = normalizeName(surname);
    const normalizedEmail = normalizeEmail(email);

    if (!firstName || !lastName || !normalizedEmail || !password) {
      return res.status(400).json({
        error: "Name, surname, email, and password are required",
      });
    }

    const users = getCollection(USERS_COLLECTION);
    const guests = getCollection(GUEST_COLLECTION);

    const [existingUser, existingGuest] = await Promise.all([
      users.findOne({ email: normalizedEmail }),
      guests.findOne({ email: normalizedEmail }),
    ]);

    if (existingUser || existingGuest) {
      return res.status(400).json({ error: "User already exists" });
    }

    if (!isMailConfigured()) {
      return res.status(503).json({
        error:
          "Email verification is currently unavailable. Please contact the site administrator.",
      });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const now = new Date();
    const fullName = composeFullName(firstName, lastName);
    const verificationToken = randomBytes(32).toString("hex");
    const verificationExpiresAt = new Date(
      now.getTime() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000
    );

    const guestDoc = {
      email: normalizedEmail,
      password_hash: passwordHash,
      role: "guest",
      name: firstName,
      surname: lastName,
      full_name: fullName,
      created_at: now,
      updated_at: now,
      verified: false,
      verification_token: verificationToken,
      verification_expires_at: verificationExpiresAt,
      verification_sent_at: now,
      verification_sent_count: 1,
      notification_opt_in: false,
    };

    const guestInsert = await guests.insertOne(guestDoc);

    try {
      await dispatchGuestVerificationEmail({
        req,
        guest: guestDoc,
        token: verificationToken,
      });
    } catch (mailErr) {
      console.error("Failed to send guest verification email", mailErr);
      await guests.deleteOne({ _id: guestInsert.insertedId });
      return res.status(500).json({
        error:
          "We couldn't send the verification email. Please try again later.",
      });
    }

    const responsePayload = {
      id: guestInsert.insertedId.toString(),
      email: normalizedEmail,
      role: "guest",
      name: firstName,
      surname: lastName,
      full_name: fullName,
      verification_required: true,
      notification_opt_in: false,
    };

    res.status(201).json(responsePayload);
  } catch (err) {
    console.error("Guest registration failed", err);
    if (err?.code === 11000) {
      return res.status(400).json({ error: "User already exists" });
    }
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password)
      return res.status(400).json({ error: "Email and password required" });

    const usersCollection = getCollection(USERS_COLLECTION);
    const guests = getCollection(GUEST_COLLECTION);

    let user = await usersCollection.findOne({ email: normalizedEmail });
    let origin = "user";

    if (!user) {
      user = await guests.findOne({ email: normalizedEmail });
      origin = user ? "guest" : origin;
    }

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    if (origin === "guest") {
      const isVerified =
        user.verified === undefined ||
        user.verified === true ||
        Boolean(user.verified_at);

      if (!isVerified) {
        const now = new Date();
        let resent = false;

        if (isMailConfigured() && shouldResendVerification(user, now)) {
          const newToken = randomBytes(32).toString("hex");
          const verificationExpiresAt = new Date(
            now.getTime() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000
          );

          await guests.updateOne(
            { _id: user._id },
            {
              $set: {
                verification_token: newToken,
                verification_expires_at: verificationExpiresAt,
                verification_sent_at: now,
                updated_at: now,
              },
              $inc: { verification_sent_count: 1 },
            }
          );

          try {
            await dispatchGuestVerificationEmail({
              req,
              guest: {
                email: user.email,
                name: user.name,
                surname: user.surname,
                full_name:
                  user.full_name || composeFullName(user.name, user.surname),
              },
              token: newToken,
            });
            resent = true;
          } catch (mailErr) {
            console.error("Failed to resend guest verification email", mailErr);
          }
        }

        return res.status(403).json({
          error: resent
            ? "Email not verified. We've just sent you a fresh verification link."
            : "Email not verified. Please check your inbox for the verification link.",
          code: "EMAIL_NOT_VERIFIED",
          verification_required: true,
          resent,
        });
      }
    }

    const resolvedRole =
      origin === "guest"
        ? "guest"
        : user.role && typeof user.role === "string"
        ? user.role
        : "admin";
    const permissions = normalizePermissions(user.permissions || []);
    const notificationOptIn = user.notification_opt_in === true;

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: resolvedRole,
        email: user.email,
        name: user.name || null,
        surname: user.surname || null,
        origin,
        permissions,
        notification_opt_in: notificationOptIn,
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: resolvedRole,
        name: user.name || null,
        surname: user.surname || null,
        full_name: user.full_name || composeFullName(user.name, user.surname),
        permissions,
        notification_opt_in: notificationOptIn,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/verify/guest", async (req, res) => {
  try {
    const token =
      typeof req.query?.token === "string" ? req.query.token.trim() : "";
    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Missing verification token.",
        code: "TOKEN_MISSING",
      });
    }

    const guests = getCollection(GUEST_COLLECTION);
    const guest = await guests.findOne({ verification_token: token });
    if (!guest) {
      return res.status(404).json({
        success: false,
        error: "Verification link is invalid or has already been used.",
        code: "TOKEN_INVALID",
      });
    }

    if (guest.verified) {
      return res.json({
        success: true,
        message: "Email already verified. You can log in now.",
        code: "ALREADY_VERIFIED",
      });
    }

    const now = new Date();
    const expiresAt = guest.verification_expires_at
      ? new Date(guest.verification_expires_at)
      : null;

    if (expiresAt && now.getTime() > expiresAt.getTime()) {
      return res.status(410).json({
        success: false,
        error:
          "Verification link has expired. Please request a new one from the login page.",
        code: "TOKEN_EXPIRED",
      });
    }

    await guests.updateOne(
      { _id: guest._id },
      {
        $set: {
          verified: true,
          verified_at: now,
          verification_verified_at: now,
          updated_at: now,
        },
        $unset: {
          verification_token: "",
          verification_expires_at: "",
        },
      }
    );

    res.json({
      success: true,
      message: "Email verified successfully. You can now log in.",
      code: "VERIFIED",
    });
  } catch (err) {
    console.error("Guest email verification failed", err);
    res.status(500).json({ success: false, error: "Verification failed" });
  }
});

router.post("/verify/guest/resend", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      return res
        .status(400)
        .json({ success: false, error: "Email is required." });
    }

    if (!isMailConfigured()) {
      return res.status(503).json({
        success: false,
        error: "Email delivery is not configured right now.",
      });
    }

    const guests = getCollection(GUEST_COLLECTION);
    const guest = await guests.findOne({ email });

    if (!guest) {
      return res.json({
        success: true,
        message:
          "If that email is registered, we'll send a fresh verification link shortly.",
        code: "UNKNOWN_EMAIL",
      });
    }

    if (guest.verified) {
      return res.json({
        success: true,
        message: "This account is already verified. You can log in now.",
        code: "ALREADY_VERIFIED",
      });
    }

    const now = new Date();
    if (!shouldResendVerification(guest, now)) {
      const waitLabel = formatMinutesLabel(
        EMAIL_VERIFICATION_RESEND_INTERVAL_MINUTES
      );
      return res.status(429).json({
        success: false,
        error: `You can request another verification email in about ${waitLabel}.`,
        code: "RESEND_TOO_SOON",
        retry_after_minutes: EMAIL_VERIFICATION_RESEND_INTERVAL_MINUTES,
      });
    }

    const newToken = randomBytes(32).toString("hex");
    const verificationExpiresAt = new Date(
      now.getTime() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000
    );

    const update = {
      verification_token: newToken,
      verification_expires_at: verificationExpiresAt,
      verification_sent_at: now,
      updated_at: now,
    };

    const updated = await guests.findOneAndUpdate(
      { _id: guest._id },
      {
        $set: update,
        $inc: { verification_sent_count: 1 },
      },
      { returnDocument: "after" }
    );

    const guestForEmail = updated.value || {
      ...guest,
      ...update,
    };

    await dispatchGuestVerificationEmail({
      req,
      guest: guestForEmail,
      token: newToken,
    });

    res.json({
      success: true,
      message: "We've sent a fresh verification email.",
      code: "RESENT",
    });
  } catch (err) {
    console.error("Failed to resend guest verification email", err);
    res
      .status(500)
      .json({ success: false, error: "Could not resend verification email." });
  }
});

router.get("/me", async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    const userId = toObjectId(payload.id);
    if (!userId) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const origin =
      typeof payload.origin === "string"
        ? payload.origin.trim().toLowerCase()
        : null;
    const inferredOrigin =
      origin === "guest" || payload.role === "guest" ? "guest" : "user";
    const collectionName =
      inferredOrigin === "guest" ? GUEST_COLLECTION : USERS_COLLECTION;
    const collection = getCollection(collectionName);
    const user = await collection.findOne(
      { _id: userId },
      {
        projection: { password_hash: 0 },
      }
    );

    if (!user) return res.status(404).json({ error: "User not found" });
    const resolvedRole =
      inferredOrigin === "guest"
        ? "guest"
        : user.role && typeof user.role === "string"
        ? user.role
        : "admin";
    const permissions = normalizePermissions(user.permissions || []);
    const notificationOptIn = user.notification_opt_in === true;
    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        role: resolvedRole,
        created_at: user.created_at,
        name: user.name || null,
        surname: user.surname || null,
        full_name: user.full_name || composeFullName(user.name, user.surname),
        permissions,
        notification_opt_in: notificationOptIn,
      },
    });
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

router.patch("/me/notifications", async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = toObjectId(payload.id);
    if (!userId) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const origin =
      typeof payload.origin === "string"
        ? payload.origin.trim().toLowerCase()
        : null;
    const inferredOrigin =
      origin === "guest" || payload.role === "guest" ? "guest" : "user";
    const collectionName =
      inferredOrigin === "guest" ? GUEST_COLLECTION : USERS_COLLECTION;
    const collection = getCollection(collectionName);

    const requestProvidedValue = Object.prototype.hasOwnProperty.call(
      req.body || {},
      "enabled"
    )
      ? req.body.enabled
      : req.body?.notification_opt_in;

    if (requestProvidedValue === undefined) {
      return res.status(400).json({ error: "Missing enabled value" });
    }

    const enabled = parseNotificationPreference(requestProvidedValue, true);
    const update = {
      notification_opt_in: enabled,
      updated_at: new Date(),
    };

    const updateResult = await collection.findOneAndUpdate(
      { _id: userId },
      { $set: update },
      { returnDocument: "after", projection: { password_hash: 0 } }
    );

    const updatedDocument =
      updateResult && typeof updateResult === "object"
        ? Object.prototype.hasOwnProperty.call(updateResult, "value")
          ? updateResult.value
          : updateResult
        : null;

    if (!updatedDocument) {
      return res.status(404).json({ error: "User not found" });
    }

    const permissions = normalizePermissions(updatedDocument.permissions || []);

    res.json({
      success: true,
      notification_opt_in: updatedDocument.notification_opt_in === true,
      permissions,
    });
  } catch (err) {
    if (err?.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    console.error("Failed to update notification preference", err);
    res.status(500).json({ error: "Failed to update notification preference" });
  }
});

export default router;
