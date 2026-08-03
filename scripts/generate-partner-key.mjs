import { randomBytes } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";

const partner = process.argv[2];
const rotate = process.argv.includes("--rotate");

if (!partner || !/^[a-z0-9-]{2,40}$/.test(partner)) {
  console.error("Usage: npm run partner:key -- <partner-id> [--rotate]");
  process.exit(1);
}

const envPath = new URL("../.env.local", import.meta.url);
let env = "";

try {
  env = await readFile(envPath, "utf8");
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const match = env.match(/^ZEITMINT_PARTNER_KEYS=(.*)$/m);
let keys = {};

if (match?.[1]) {
  try {
    keys = JSON.parse(match[1]);
  } catch {
    console.error("ZEITMINT_PARTNER_KEYS in .env.local is not valid JSON.");
    process.exit(1);
  }
}

if (keys[partner] && !rotate) {
  console.error(`A key for ${partner} already exists. Add --rotate to replace it.`);
  process.exit(1);
}

const key = randomBytes(32).toString("base64url");
keys[partner] = key;
const line = `ZEITMINT_PARTNER_KEYS=${JSON.stringify(keys)}`;

if (match) {
  env = env.replace(/^ZEITMINT_PARTNER_KEYS=.*$/m, line);
} else {
  env = `${env.trimEnd()}${env.trim() ? "\n\n" : ""}# Partner API bearer tokens\n${line}\n`;
}

await writeFile(envPath, env, { encoding: "utf8", mode: 0o600 });
await chmod(envPath, 0o600);

console.log(`Created a ${partner} partner token and saved it to .env.local.`);
console.log("Share this token privately; it is shown only during creation:");
console.log(key);
console.log("Run npm run env:vercel to sync it before deployment.");
