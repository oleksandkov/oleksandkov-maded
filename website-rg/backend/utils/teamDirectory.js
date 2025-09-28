const TEAM_DIRECTORY = [
  {
    name: "Oleksandr Kovalenko",
    email: "muaronok@gmail.com",
    role: "Lead Engineer",
  },
  {
    name: "Mariana Danyliuk",
    email: "mariana@smallco.com",
    role: "Product Strategist",
  },
  {
    name: "Taras Hrytsenko",
    email: "taras@smallco.com",
    role: "UX Researcher",
  },
];

const TEAM_LOOKUP = new Map(
  TEAM_DIRECTORY.map((member) => [member.name.toLowerCase(), member])
);

export function findTeamMember(name) {
  if (!name) return null;
  const normalized = String(name).trim().toLowerCase();
  if (!normalized) return null;
  return TEAM_LOOKUP.get(normalized) || null;
}

export function getContactsForMembers(names = []) {
  if (!Array.isArray(names)) return { contacts: [], missing: [] };
  const contacts = [];
  const missing = new Set();
  const seenEmails = new Set();

  names.forEach((name) => {
    const member = findTeamMember(name);
    if (member?.email) {
      if (!seenEmails.has(member.email)) {
        contacts.push({ name: member.name, email: member.email });
        seenEmails.add(member.email);
      }
    } else if (name) {
      const normalized = String(name).trim();
      if (normalized) {
        missing.add(normalized);
      }
    }
  });

  return { contacts, missing: Array.from(missing) };
}

export function listTeamMemberEmails() {
  return TEAM_DIRECTORY.map((member) => member.email).filter(Boolean);
}

export { TEAM_DIRECTORY };
