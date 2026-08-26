// Shared mailboxes shouldn't be greeted by name — "Hi Support," reads worse than
// "Hi there,".
const GENERIC = new Set([
  "info", "sales", "support", "hello", "hi", "admin", "contact", "team", "help",
  "office", "mail", "email", "enquiries", "inquiries", "noreply", "no-reply", "careers",
  "jobs", "billing", "accounts", "marketing", "press",
]);

/** Best-effort first name from an address: john.smith@x.com -> "John".
 *  Falls back to "there" so the greeting still reads naturally. */
export function deriveFirstName(email: string): string {
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (GENERIC.has(local.replace(/[^a-z-]/g, ""))) return "there";

  const candidate = local
    .split(/[._+-]/)
    .map((part) => part.replace(/\d+/g, ""))
    .find((part) => part.length >= 2);

  if (!candidate) return "there";
  return candidate.charAt(0).toUpperCase() + candidate.slice(1);
}

/** Fills the tags the assistant is allowed to use. Runs per recipient at send time,
 *  which is why one draft can greet a whole list correctly. */
export function applyMergeTags(text: string, recipient: string): string {
  const firstName = deriveFirstName(recipient);
  return text
    .replace(/\{\{\s*firstName\s*\}\}/gi, firstName)
    .replace(/\{\{\s*name\s*\}\}/gi, firstName)
    .replace(/\{\{\s*email\s*\}\}/gi, recipient);
}
