import { requireAdmin } from "@/lib/admin";
import { getContacts } from "@/lib/contact-tracking";
import { row, csvResponse } from "@/lib/csv";

// Flat one-row-per-person export, for cross-checking against anything kept
// outside the app.
export async function GET() {
  await requireAdmin();
  const contacts = await getContacts();

  const lines = [
    row([
      "Name", "Email", "Interests", "Sources", "First seen", "Last seen",
      "Times messaged", "Last messaged", "Possible duplicate of",
    ]),
    ...contacts.map((c) =>
      row([
        c.name,
        c.email,
        c.interests.join("; "),
        c.sources.join("; "),
        c.firstSeen.slice(0, 10),
        c.lastSeen.slice(0, 10),
        String(c.outreach.length),
        c.outreach[0]?.at.slice(0, 10) ?? "",
        c.possibleDuplicateOf.join("; "),
      ])
    ),
  ];

  return csvResponse(lines, "contacts");
}
