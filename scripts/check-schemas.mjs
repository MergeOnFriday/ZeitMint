import { readFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const schemas = [
  "launch-kit.schema.json",
  "readiness-report.schema.json",
  "utility-manifest.schema.json",
];

const additionalJsonDocuments = [
  "public/.well-known/zeitmint.json",
  "public/partner-api.json",
  "public/partner-capability.schema.json",
];

for (const name of schemas) {
  const [publicSchema, packageSchema] = await Promise.all([
    readFile(new URL(`../public/${name}`, import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL(`../packages/launch-kit/schemas/${name}`, import.meta.url), "utf8").then(JSON.parse),
  ]);

  if (!isDeepStrictEqual(publicSchema, packageSchema)) {
    console.error(`${name} differs between public/ and packages/launch-kit/schemas/.`);
    process.exit(1);
  }
}

for (const path of additionalJsonDocuments) {
  await readFile(new URL(`../${path}`, import.meta.url), "utf8").then(JSON.parse);
}

const [sdkPackage, capability, capabilitySchema] = await Promise.all([
  readFile(new URL("../packages/launch-kit/package.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../public/.well-known/zeitmint.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../public/partner-capability.schema.json", import.meta.url), "utf8").then(JSON.parse),
]);

if (sdkPackage.version !== capability.sdk.version) {
  console.error("SDK package and capability-manifest versions differ.");
  process.exit(1);
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validateCapability = ajv.compile(capabilitySchema);
if (!validateCapability(capability)) {
  console.error("Partner capability manifest does not match its schema.");
  console.error(validateCapability.errors);
  process.exit(1);
}

console.log(
  `Verified ${schemas.length} packaged schemas and ${additionalJsonDocuments.length} partner JSON documents.`,
);
