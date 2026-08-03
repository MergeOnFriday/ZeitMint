import {
  isSameOriginRequest,
  publicJson,
  readLimitedJson,
} from "@/app/lib/public-request";
import { isTelegramConfigured, sendTelegramMessage } from "@/app/lib/telegram";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const botPattern = /bot|crawler|spider|slurp|headless/i;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return publicJson({ error: "Invalid origin." }, 403);
  }

  const body = await readLimitedJson(request);
  if (!body.ok) {
    return publicJson({ error: body.message }, body.status);
  }
  if (typeof body.value !== "object" || body.value === null || Array.isArray(body.value)) {
    return publicJson({ error: "Invalid request." }, 400);
  }

  const record = body.value as Record<string, unknown>;
  const email = typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  const company = typeof record.company === "string" ? record.company.trim() : "";
  const startedAt = typeof record.startedAt === "number" ? record.startedAt : 0;
  const elapsed = Date.now() - startedAt;
  const looksAutomated =
    Boolean(company) ||
    botPattern.test(request.headers.get("user-agent") || "") ||
    !Number.isSafeInteger(startedAt) ||
    elapsed < 800 ||
    elapsed > 24 * 60 * 60 * 1_000;

  if (looksAutomated) return publicJson({ ok: true });

  if (!emailPattern.test(email) || email.length > 254) {
    return publicJson({ error: "Enter a valid email address." }, 400);
  }

  if (!isTelegramConfigured()) {
    return publicJson(
      { error: "The founding list is temporarily unavailable. Email devs@zeitmint.com instead." },
      503,
    );
  }

  try {
    await sendTelegramMessage(
      [
        "🚀 New ZeitMint waitlister",
        `Email: ${email}`,
        `Time: ${new Date().toISOString()}`,
      ].join("\n"),
    );
    return publicJson({ ok: true });
  } catch (error) {
    console.error("Waitlist notification failed", error instanceof Error ? error.message : "unknown-error");
    return publicJson(
      { error: "We couldn’t save your signup. Email devs@zeitmint.com instead." },
      502,
    );
  }
}
