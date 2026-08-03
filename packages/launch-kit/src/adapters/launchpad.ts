import { createPartnerHandoff, type ZeitMintBundle } from "../bundle.js";
import {
  ZeitMintValidationError,
  type ValidationIssue,
  type ValidationResult,
} from "../validate.js";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type LaunchpadFeeIntent = {
  buyFeeBps?: number;
  sellFeeBps?: number;
  graduationFeeBps?: number;
  tradingFeeBps?: number;
  routingNote?: string;
};

export type LaunchpadDraftOptions = {
  chain?: string;
  launchType?: string;
  venue?: string;
  startingMarketCapUsd?: number;
  initialBuyAmount?: string;
  feeIntent?: LaunchpadFeeIntent;
  extensions?: Record<string, JsonValue>;
};

const identifierPattern = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/;
const chainPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function validateText(
  value: string | undefined,
  path: string,
  label: string,
  issues: ValidationIssue[],
) {
  if (value === undefined) return;
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 128) {
    issues.push({ path, code: "type", message: `${label} must be a non-empty string up to 128 characters.` });
  }
}

function validateBps(value: number | undefined, path: string, issues: ValidationIssue[]) {
  if (value === undefined) return;
  if (!Number.isInteger(value) || value < 0 || value > 10_000) {
    issues.push({ path, code: "range", message: "Fee intent must be an integer from 0 to 10,000 basis points." });
  }
}

function isJsonValue(value: unknown, depth = 0): value is JsonValue {
  if (depth > 8) return false;
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every((item) => isJsonValue(item, depth + 1));
  if (typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).every((item) => isJsonValue(item, depth + 1));
}

export function validateLaunchpadId(input: unknown): ValidationResult<string> {
  if (typeof input !== "string" || !identifierPattern.test(input)) {
    return {
      valid: false,
      issues: [{
        path: "/launchpad",
        code: "format",
        message: "Launchpad ID must be a lowercase slug containing letters, numbers, dots, underscores or hyphens.",
      }],
    };
  }
  return { valid: true, value: input, issues: [] };
}

export function validateLaunchpadDraftOptions(
  input: unknown,
): ValidationResult<LaunchpadDraftOptions> {
  if (input === undefined) return { valid: true, value: {}, issues: [] };
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { valid: false, issues: [{ path: "/options", code: "type", message: "Options must be an object." }] };
  }

  const options = input as LaunchpadDraftOptions;
  const record = input as Record<string, unknown>;
  const issues: ValidationIssue[] = [];
  const allowedKeys = new Set([
    "chain",
    "launchType",
    "venue",
    "startingMarketCapUsd",
    "initialBuyAmount",
    "feeIntent",
    "extensions",
  ]);

  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key)) {
      issues.push({ path: `/options/${key}`, code: "additionalProperties", message: "Unknown launchpad draft option." });
    }
  }

  if (options.chain !== undefined && (typeof options.chain !== "string" || !chainPattern.test(options.chain))) {
    issues.push({
      path: "/options/chain",
      code: "format",
      message: "Chain must be a portable identifier up to 128 characters; CAIP-style IDs are supported.",
    });
  }
  validateText(options.launchType, "/options/launchType", "Launch type", issues);
  validateText(options.venue, "/options/venue", "Venue", issues);
  validateText(options.initialBuyAmount, "/options/initialBuyAmount", "Initial buy amount", issues);

  if (
    options.startingMarketCapUsd !== undefined &&
    (!Number.isFinite(options.startingMarketCapUsd) || options.startingMarketCapUsd <= 0)
  ) {
    issues.push({ path: "/options/startingMarketCapUsd", code: "range", message: "Starting market cap must be positive." });
  }

  if (options.feeIntent !== undefined && (typeof options.feeIntent !== "object" || options.feeIntent === null || Array.isArray(options.feeIntent))) {
    issues.push({ path: "/options/feeIntent", code: "type", message: "Fee intent must be an object." });
  } else if (options.feeIntent) {
    const allowedFeeKeys = new Set(["buyFeeBps", "sellFeeBps", "graduationFeeBps", "tradingFeeBps", "routingNote"]);
    for (const key of Object.keys(options.feeIntent)) {
      if (!allowedFeeKeys.has(key)) {
        issues.push({ path: `/options/feeIntent/${key}`, code: "additionalProperties", message: "Unknown fee-intent option." });
      }
    }
    validateBps(options.feeIntent.buyFeeBps, "/options/feeIntent/buyFeeBps", issues);
    validateBps(options.feeIntent.sellFeeBps, "/options/feeIntent/sellFeeBps", issues);
    validateBps(options.feeIntent.graduationFeeBps, "/options/feeIntent/graduationFeeBps", issues);
    validateBps(options.feeIntent.tradingFeeBps, "/options/feeIntent/tradingFeeBps", issues);
    if (
      options.feeIntent.routingNote !== undefined &&
      (typeof options.feeIntent.routingNote !== "string" || options.feeIntent.routingNote.length > 500)
    ) {
      issues.push({ path: "/options/feeIntent/routingNote", code: "type", message: "Routing note must be a string up to 500 characters." });
    }
  }

  if (
    options.extensions !== undefined &&
    (typeof options.extensions !== "object" || options.extensions === null || Array.isArray(options.extensions) || !isJsonValue(options.extensions))
  ) {
    issues.push({ path: "/options/extensions", code: "type", message: "Extensions must be a JSON object no more than eight levels deep." });
  }

  return issues.length > 0 ? { valid: false, issues } : { valid: true, value: options, issues: [] };
}

export function createLaunchpadDraft(
  bundle: ZeitMintBundle,
  launchpad: string,
  options: LaunchpadDraftOptions = {},
  generatedAt = new Date().toISOString(),
) {
  const launchpadResult = validateLaunchpadId(launchpad);
  const optionsResult = validateLaunchpadDraftOptions(options);
  const issues = [
    ...(launchpadResult.valid ? [] : launchpadResult.issues),
    ...(optionsResult.valid ? [] : optionsResult.issues),
  ];
  if (!launchpadResult.valid || !optionsResult.valid) {
    throw new ZeitMintValidationError("Launchpad draft options failed validation.", issues);
  }

  const handoff = createPartnerHandoff(bundle, launchpadResult.value, generatedAt);
  const chain = optionsResult.value.chain ?? bundle.launchKit.handoff.preferredChain;
  const missingRequiredFields: string[] = [];

  if (!handoff.token.name) missingRequiredFields.push("token.name");
  if (!handoff.token.symbol) missingRequiredFields.push("token.symbol");
  if (!handoff.token.artworkUrl) missingRequiredFields.push("token.artworkUrl");
  if (!chain) missingRequiredFields.push("launch.chain");

  return {
    profile: {
      id: "zeitmint-launchpad-handoff",
      version: "1.0",
      targetLaunchpad: launchpadResult.value,
      submissionStatus: "partner-controlled",
    },
    generatedAt,
    token: handoff.token,
    socials: handoff.links,
    launch: {
      chain,
      requestedZeitMintChain: bundle.launchKit.handoff.preferredChain,
      type: optionsResult.value.launchType ?? null,
      venue: optionsResult.value.venue ?? null,
      startingMarketCapUsd: optionsResult.value.startingMarketCapUsd ?? null,
      initialBuyAmount: optionsResult.value.initialBuyAmount ?? null,
    },
    feeIntent: optionsResult.value.feeIntent ?? null,
    extensions: optionsResult.value.extensions ?? {},
    creative: handoff.creative,
    campaign: handoff.campaign,
    utility: handoff.utility,
    mission: handoff.mission,
    readiness: handoff.readiness,
    review: {
      readyForPartnerReview: missingRequiredFields.length === 0,
      missingRequiredFields,
      creatorApprovalRequired: true,
      partnerApprovalRequired: true,
      valuesAreIntentOnly: true,
      deploysToken: false,
      movesFunds: false,
    },
  } as const;
}
