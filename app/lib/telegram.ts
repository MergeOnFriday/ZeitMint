type TelegramResponse = {
  ok?: boolean;
  description?: string;
};

export function isTelegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export async function sendTelegramMessage(text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    throw new Error("Telegram notifications are not configured.");
  }
  if (!text || text.length > 4_000) {
    throw new Error("Telegram notification length is invalid.");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    },
  );
  const result = await response.json().catch(() => ({})) as TelegramResponse;

  if (!response.ok || !result.ok) {
    throw new Error(result.description || "Telegram rejected the notification.");
  }
}
