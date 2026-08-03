import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

for (const file of [".env", ".env.local"]) {
  if (existsSync(file)) loadEnvFile(file);
}

const requiredVariableNames = [
  "NEXT_PUBLIC_PAYMENT_NETWORK",
  "NEXT_PUBLIC_PAYMENT_ASSET",
  "NEXT_PUBLIC_PAYMENT_AMOUNT",
  "NEXT_PUBLIC_PAYMENT_RECIPIENT",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
];
const optionalVariableNames = [
  "NEXT_PUBLIC_RH_REGISTRY_ADDRESS",
  "ZEITMINT_PARTNER_KEYS",
];
const variableNames = [
  ...requiredVariableNames,
  ...optionalVariableNames.filter((name) => process.env[name]),
];
const dryRun = process.argv.includes("--dry-run");

const missing = requiredVariableNames.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Missing required variables: ${missing.join(", ")}`);
  console.error("Add private values to .env.local, then run this command again.");
  process.exit(1);
}

for (const name of variableNames) {
  const isPublic = name.startsWith("NEXT_PUBLIC_");

  if (dryRun) {
    console.log(`Ready to sync ${name}.`);
    continue;
  }

  const result = spawnSync(
    "vercel",
    [
      "env",
      "add",
      name,
      isPublic ? "production,preview,development" : "production,preview",
      "--force",
      "--yes",
      isPublic ? "--no-sensitive" : "--sensitive",
    ],
    {
      env: {
        ...process.env,
        VERCEL_FORCE_NO_UPDATE_CHECK: "1",
      },
      input: `${process.env[name]}\n`,
      stdio: ["pipe", "inherit", "inherit"],
    },
  );

  if (result.status !== 0) {
    console.error(`Failed to sync ${name}.`);
    process.exit(result.status ?? 1);
  }
}

console.log(dryRun ? "Environment configuration is valid." : "Vercel environment variables are synced.");
