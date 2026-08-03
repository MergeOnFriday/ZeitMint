import { NextResponse } from "next/server";
import { isTelegramConfigured, sendTelegramMessage } from "@/app/lib/telegram";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { email?: unknown; company?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const company = typeof body.company === "string" ? body.company.trim() : "";

  if (company) return NextResponse.json({ ok: true });

  if (!emailPattern.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!isTelegramConfigured()) {
    return NextResponse.json(
      { error: "The waitlist is not connected to Telegram yet." },
      { status: 503 },
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
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "We couldn’t send your signup to Telegram. Please try again." },
      { status: 502 },
    );
  }
}
