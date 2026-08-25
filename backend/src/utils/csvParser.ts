import { parse } from "csv-parse/sync";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function extractEmails(fileText: string, filename: string) {
  const tokens = filename.toLowerCase().endsWith(".csv")
    ? (parse(fileText, { skip_empty_lines: true, relax_column_count: true }) as string[][]).flat()
    : fileText.split(/\r?\n/);

  const seen = new Set<string>();
  let invalidRows = 0;

  for (const raw of tokens) {
    const candidate = raw.trim();
    if (!candidate) continue;
    if (EMAIL_RE.test(candidate)) {
      seen.add(candidate.toLowerCase());
    } else {
      invalidRows++;
    }
  }

  return { emails: [...seen], count: seen.size, invalidRows };
}
