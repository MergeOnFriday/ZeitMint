import {
  isSameOriginRequest,
  oneLine,
  publicJson,
  readLimitedJson,
} from "@/app/lib/public-request";
import { isTelegramConfigured, sendTelegramMessage } from "@/app/lib/telegram";

const botPattern = /bot|crawler|spider|slurp|headless|preview/i;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return publicJson({ error: "Invalid origin." }, 403);
  }

  const userAgent = request.headers.get("user-agent") || "";
  if (botPattern.test(userAgent) || !isTelegramConfigured()) {
    return publicJson({ ok: true, skipped: true });
  }

  const body = await readLimitedJson(request);
  if (!body.ok) {
    return publicJson({ error: body.message }, body.status);
  }
  const record = typeof body.value === "object" && body.value !== null && !Array.isArray(body.value)
    ? body.value as Record<string, unknown>
    : {};
  const submittedPath = oneLine(record.path, "/", 120);
  const path = submittedPath.startsWith("/") ? submittedPath : "/";
  const referrer = oneLine(record.referrer, "Direct", 120);

  try {
    await sendTelegramMessage(
      [
        "👀 New ZeitMint visitor",
        `Page: ${path}`,
        `From: ${referrer}`,
        `Time: ${new Date().toISOString()}`,
      ].join("\n"),
    );
    return publicJson({ ok: true });
  } catch (error) {
    console.error("Visit notification failed", error instanceof Error ? error.message : "unknown-error");
    return publicJson({ error: "Notification failed." }, 502);
  }
}
