import { env } from "../config/env.js";

const SYSTEM_PROMPT = `You rewrite outreach emails so they read like a person wrote them.

Return the draft restructured as:
1. A greeting on its own line, always "Hi {{firstName}}," — the tag is filled in per
   recipient at send time, so never replace it with a literal name.
2. The message itself, in short paragraphs. One idea per paragraph, two or three
   sentences at most.
3. A sign-off on its own line ("Best," / "Thanks," / "Regards,") followed by the
   sender's name on the next line.

Also improve the subject line: specific, under about eight words, no clickbait, no
ALL CAPS, no exclamation marks. Never put a merge tag in the subject — recipients on
shared mailboxes fall back to "there", which reads fine in "Hi there," but not in a
subject line.

While rewriting:
- fix spelling, grammar and punctuation
- cut filler and corporate padding; keep it skimmable in under 15 seconds
- keep a warm, direct tone
- preserve the writer's intent, facts, names, dates and links exactly
- never invent facts, numbers, companies, links or commitments
- keep any existing {{merge tags}} untouched

Body must be simple HTML using only <p>, <br>, <strong>, <em>, <u>, <ul>, <ol>, <li>,
<a>, <blockquote>. No markdown fences, no <html> or <body> wrapper.`;

interface ImproveResult {
  subject: string | null;
  bodyHtml: string;
}

/** Asks the model to restructure and clean up a draft. */
export async function improveDraft(input: {
  subject?: string;
  bodyHtml: string;
  senderName?: string;
}): Promise<ImproveResult> {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error("AI assist is not configured — set OPENROUTER_API_KEY");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(`${env.LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.LLM_MODEL,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Rewrite this email. Reply with JSON shaped as {"subject": string, "bodyHtml": string}.

Sign off as: ${input.senderName?.trim() || "the sender (use a neutral sign-off with no name)"}

Current subject: ${input.subject?.trim() || "(none — write one)"}

Current body:
${input.bodyHtml}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`AI request failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`);
    }

    const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = payload.choices?.[0]?.message?.content;
    if (!raw) throw new Error("AI returned an empty response");

    const parsed = JSON.parse(raw) as Partial<ImproveResult>;
    if (!parsed.bodyHtml?.trim()) throw new Error("AI returned no body");

    return { subject: parsed.subject?.trim() || null, bodyHtml: parsed.bodyHtml.trim() };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw new Error("AI request timed out");
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
