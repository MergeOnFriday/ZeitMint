import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

for (const file of [".env", ".env.local"]) {
  if (existsSync(file)) loadEnvFile(file);
}

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("Add TELEGRAM_BOT_TOKEN to .env.local first.");
  process.exit(1);
}

const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
const payload = await response.json();

if (!response.ok || !payload.ok) {
  console.error(payload.description || "Telegram could not return bot updates.");
  process.exit(1);
}

const chats = new Map();
for (const update of payload.result) {
  const message = update.message || update.channel_post;
  if (!message?.chat?.id) continue;
  const label =
    message.chat.title ||
    message.chat.username ||
    [message.chat.first_name, message.chat.last_name].filter(Boolean).join(" ") ||
    "Telegram chat";
  chats.set(String(message.chat.id), label);
}

if (chats.size === 0) {
  console.log("No chats found. Send the bot a message in Telegram, then run this command again.");
  process.exit(0);
}

for (const [id, label] of chats) {
  console.log(`${label}: ${id}`);
}
