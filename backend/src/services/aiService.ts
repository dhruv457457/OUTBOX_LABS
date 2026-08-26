import { env } from "../config/env.js";

const SYSTEM_PROMPT = `You polish cold outreach emails.

Given a draft, return an improved version that:
- fixes spelling, grammar and punctuation
- tightens rambling sentences and removes filler
- keeps a warm, direct, human tone — never corporate filler or hype
- preserves the writer's intent, facts, names and any links exactly
- keeps it short; cold emails should be skimmable in under 15 seconds

Rules:
- Never invent facts, names, numbers, companies or links.
- Never add placeholders like [Your Name] unless the draft already had them.
- Keep any merge tags such as {{firstName}} untouched.
- Body must be simple HTML using only <p>, <br>, <strong>, <em>, <u>, <ul>, <ol>, <li>, <a>, <blockquote>.
- Do not wrap the output in markdown fences or <html>/<body> tags.`;

interface ImproveResult {
  subject: string | null;
  bodyHtml: string;
}

/** Asks the model to clean up a draft. Returns the improved subject and body. */
export async function improveDraft(input: { subject?: string; bodyHtml: string }): Promise<ImproveResult> {
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
            content: `Improve this email and reply with JSON shaped as {"subject": string, "bodyHtml": string}.
If no subject is supplied, suggest a short one.

Subject: ${input.subject?.trim() || "(none)"}

Body HTML:
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
