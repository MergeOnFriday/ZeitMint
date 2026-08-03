import { createPartnerHandoff, type ZeitMintBundle } from "../bundle.js";
import {
  ZeitMintValidationError,
  type ValidationIssue,
  type ValidationResult,
} from "../validate.js";

export type BasedBidChain =
  | "base"
  | "solana"
  | "ethereum"
  | "bnb"
  | "robinhood-chain"
  | "other";

export type BasedBidLaunchType = "pool" | "flash-token" | "board";

export type BasedBidFeeIntent = {
  preGraduationBuyFeeBps?: number;
  preGraduationSellFeeBps?: number;
  graduationFeeBps?: number;
  postGraduationTradingFeeBps?: number;
  routingNote?: string;
};

export type BasedBidDraftOptions = {
  chain?: BasedBidChain;
  launchType?: BasedBidLaunchType;
  dex?: string;
  startingMarketCapUsd?: number;
  initialBuyAmount?: string;
  feeIntent?: BasedBidFeeIntent;
};

function validateBps(value: number | undefined, path: string, issues: ValidationIssue[]) {
  if (value === undefined) return;
  if (!Number.isInteger(value) || value < 0 || value > 10_000) {
    issues.push({ path, code: "range", message: "Fee intent must be an integer from 0 to 10,000 basis points." });
  }
}

export function validateBasedBidDraftOptions(
  input: unknown,
): ValidationResult<BasedBidDraftOptions> {
  if (input === undefined) return { valid: true, value: {}, issues: [] };
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { valid: false, issues: [{ path: "/options", code: "type", message: "Options must be an object." }] };
  }

  const options = input as BasedBidDraftOptions;
  const record = input as Record<string, unknown>;
  const issues: ValidationIssue[] = [];
  const chains: BasedBidChain[] = ["base", "solana", "ethereum", "bnb", "robinhood-chain", "other"];
  const launchTypes: BasedBidLaunchType[] = ["pool", "flash-token", "board"];
  const allowedKeys = new Set(["chain", "launchType", "dex", "startingMarketCapUsd", "initialBuyAmount", "feeIntent"]);

  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key)) {
      issues.push({ path: `/options/${key}`, code: "additionalProperties", message: "Unknown Based.bid draft option." });
    }
  }

  if (options.chain !== undefined && !chains.includes(options.chain)) {
    issues.push({ path: "/options/chain", code: "enum", message: "Unsupported Based.bid chain preference." });
  }
  if (options.launchType !== undefined && !launchTypes.includes(options.launchType)) {
    issues.push({ path: "/options/launchType", code: "enum", message: "Unsupported launch type." });
  }
  if (options.dex !== undefined && (typeof options.dex !== "string" || options.dex.trim().length === 0 || options.dex.length > 64)) {
    issues.push({ path: "/options/dex", code: "type", message: "DEX must be a non-empty string up to 64 characters." });
  }
  if (
    options.startingMarketCapUsd !== undefined &&
    (!Number.isFinite(options.startingMarketCapUsd) || options.startingMarketCapUsd <= 0)
  ) {
    issues.push({ path: "/options/startingMarketCapUsd", code: "range", message: "Starting market cap must be positive." });
  }
  if (
    options.initialBuyAmount !== undefined &&
    (typeof options.initialBuyAmount !== "string" || options.initialBuyAmount.trim().length === 0 || options.initialBuyAmount.length > 128)
  ) {
    issues.push({ path: "/options/initialBuyAmount", code: "type", message: "Initial buy amount must be a non-empty string up to 128 characters." });
  }
  if (options.feeIntent !== undefined && (typeof options.feeIntent !== "object" || options.feeIntent === null || Array.isArray(options.feeIntent))) {
    issues.push({ path: "/options/feeIntent", code: "type", message: "Fee intent must be an object." });
  } else if (options.feeIntent) {
    const allowedFeeKeys = new Set([
      "preGraduationBuyFeeBps",
      "preGraduationSellFeeBps",
      "graduationFeeBps",
      "postGraduationTradingFeeBps",
      "routingNote",
    ]);
    for (const key of Object.keys(options.feeIntent)) {
      if (!allowedFeeKeys.has(key)) {
        issues.push({ path: `/options/feeIntent/${key}`, code: "additionalProperties", message: "Unknown fee-intent option." });
      }
    }
    validateBps(options.feeIntent.preGraduationBuyFeeBps, "/options/feeIntent/preGraduationBuyFeeBps", issues);
    validateBps(options.feeIntent.preGraduationSellFeeBps, "/options/feeIntent/preGraduationSellFeeBps", issues);
    validateBps(options.feeIntent.graduationFeeBps, "/options/feeIntent/graduationFeeBps", issues);
    validateBps(options.feeIntent.postGraduationTradingFeeBps, "/options/feeIntent/postGraduationTradingFeeBps", issues);
    if (
      options.feeIntent.routingNote !== undefined &&
      (typeof options.feeIntent.routingNote !== "string" || options.feeIntent.routingNote.length > 500)
    ) {
      issues.push({ path: "/options/feeIntent/routingNote", code: "type", message: "Routing note must be a string up to 500 characters." });
    }
  }

  return issues.length > 0 ? { valid: false, issues } : { valid: true, value: options, issues: [] };
}

function inferredChain(bundle: ZeitMintBundle): BasedBidChain | null {
  return bundle.launchKit.handoff.preferredChain === "solana" ? "solana" : null;
}

export function createBasedBidDraft(
  bundle: ZeitMintBundle,
  options: BasedBidDraftOptions = {},
  generatedAt = new Date().toISOString(),
) {
  const validation = validateBasedBidDraftOptions(options);
  if (!validation.valid) {
    throw new ZeitMintValidationError("Based.bid draft options failed validation.", validation.issues);
  }

  const handoff = createPartnerHandoff(bundle, "based-bid", generatedAt);
  const chain = options.chain ?? inferredChain(bundle);
  const missingRequiredFields: string[] = [];

  if (!handoff.token.name) missingRequiredFields.push("token.name");
  if (!handoff.token.symbol) missingRequiredFields.push("token.symbol");
  if (!handoff.token.artworkUrl) missingRequiredFields.push("token.artworkUrl");
  if (!chain) missingRequiredFields.push("launch.chain");

  return {
    adapter: {
      id: "based-bid",
      version: "0.1.0",
      mappingStatus: "ready-for-partner-review",
      submissionStatus: "awaiting-partner-api-contract",
    },
    generatedAt,
    token: handoff.token,
    socials: handoff.links,
    launch: {
      chain,
      requestedZeitMintChain: bundle.launchKit.handoff.preferredChain,
      type: options.launchType ?? "pool",
      dex: options.dex ?? null,
      startingMarketCapUsd: options.startingMarketCapUsd ?? null,
      initialBuyAmount: options.initialBuyAmount ?? null,
    },
    feeIntent: options.feeIntent ?? null,
    creative: handoff.creative,
    campaign: handoff.campaign,
    utility: handoff.utility,
    mission: handoff.mission,
    readiness: handoff.readiness,
    review: {
      readyForPartnerReview: missingRequiredFields.length === 0,
      missingRequiredFields,
      creatorApprovalRequired: true,
      basedBidApprovalRequired: true,
      valuesAreIntentOnly: true,
      deploysToken: false,
      movesFunds: false,
    },
  } as const;
}
