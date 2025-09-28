function formatEventDateTime(value, options = {}) {
  if (!value) return "TBD";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  const {
    dateStyle = "full",
    timeStyle = "short",
    locale = "en-US",
    ...formatOptions
  } = options;
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle,
    ...formatOptions,
  });
  return formatter.format(date);
}

function formatDuration(minutes) {
  const total = Number(minutes);
  if (!Number.isFinite(total) || total <= 0) return "";
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  const parts = [];
  if (hours) {
    parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  }
  if (mins) {
    parts.push(`${mins} ${mins === 1 ? "minute" : "minutes"}`);
  }
  if (!parts.length) {
    parts.push("Less than a minute");
  }
  return parts.join(" ");
}

function computeEventEndDate(start, durationMinutes) {
  if (!start) return null;
  const startDate = start instanceof Date ? new Date(start) : new Date(start);
  if (Number.isNaN(startDate.getTime())) return null;
  const minutes = Number(durationMinutes);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  return new Date(startDate.getTime() + minutes * 60 * 1000);
}

function formatEventTimeRange(start, durationMinutes, options = {}) {
  const startDate = start instanceof Date ? new Date(start) : new Date(start);
  if (Number.isNaN(startDate.getTime())) return "";
  const endDate = computeEventEndDate(startDate, durationMinutes);
  const {
    locale = "en-US",
    hour = "2-digit",
    minute = "2-digit",
    hour12 = false,
    ...formatOptions
  } = options;
  const formatter = new Intl.DateTimeFormat(locale, {
    hour,
    minute,
    hour12,
    ...formatOptions,
  });
  const startLabel = formatter.format(startDate);
  if (!endDate) return startLabel;
  const endLabel = formatter.format(endDate);
  return `${startLabel} - ${endLabel}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function linesToHtml(lines) {
  if (!Array.isArray(lines) || !lines.length) {
    return "";
  }

  return lines
    .map((line) =>
      line
        ? `<p>${escapeHtml(line).replace(/\n/g, "<br />")}</p>`
        : "<p>&nbsp;</p>"
    )
    .join("\n");
}

export function buildEventEmailTemplate(event, contacts = [], options = {}) {
  if (!event) {
    return { text: "", html: "" };
  }

  const extraMessage =
    typeof options.extraMessage === "string" ? options.extraMessage.trim() : "";

  const names = Array.isArray(event.team_members)
    ? event.team_members.filter(Boolean)
    : [];
  const contactMap = new Map(
    contacts
      .filter((contact) => contact && contact.name)
      .map((contact) => [contact.name, contact])
  );

  const when = formatEventDateTime(event.start_at, {
    dateStyle: "full",
    timeStyle: "short",
    locale: "en-US",
  });
  const timeRangeLabel = formatEventTimeRange(
    event.start_at,
    event.duration_minutes,
    {
      locale: "en-US",
    }
  );
  const durationLabel = formatDuration(event.duration_minutes);

  const greeting = names.length ? `Hi ${names.join(", ")},` : "Hi team,";

  const lines = [];

  if (extraMessage) {
    extraMessage.split(/\r?\n/).forEach((line) => lines.push(line));
    lines.push("");
  }

  lines.push(greeting, "");

  if (event.description) {
    lines.push(event.description.trim(), "");
  }

  lines.push("Event details:");
  lines.push(`When: ${when}`);
  if (timeRangeLabel) {
    lines.push(`Time: ${timeRangeLabel}`);
  }
  if (durationLabel) {
    lines.push(`Duration: ${durationLabel}`);
  }
  if (event.location) {
    lines.push(`Where: ${event.location}`);
  }

  if (names.length) {
    lines.push("", "Attendees:");
    names.forEach((name) => {
      const contact = contactMap.get(name);
      if (contact?.email) {
        lines.push(`- ${name} — ${contact.email}`);
      } else {
        lines.push(`- ${name}`);
      }
    });
  }

  lines.push("", "See you there!");

  const text = lines.join("\n");
  const html = linesToHtml(lines);

  return { text, html };
}
