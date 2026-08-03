import { NextResponse } from "next/server";
import { isTelegramConfigured, sendTelegramMessage } from "@/app/lib/telegram";

const botPattern = /bot|crawler|spider|slurp|headless|preview/i;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");

  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
    }
  }

  const userAgent = request.headers.get("user-agent") || "";
  if (botPattern.test(userAgent) || !isTelegramConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let body: { path?: unknown; referrer?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const path = typeof body.path === "string" ? body.path.slice(0, 120) : "/";
  const referrer =
    typeof body.referrer === "string" ? body.referrer.slice(0, 120) : "Direct";

  try {
    await sendTelegramMessage(
      [
        "👀 New ZeitMint visitor",
        `Page: ${path || "/"}`,
        `From: ${referrer || "Direct"}`,
        `Time: ${new Date().toISOString()}`,
      ].join("\n"),
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Notification failed." }, { status: 502 });
  }
}
