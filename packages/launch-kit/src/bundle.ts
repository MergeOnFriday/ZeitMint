import type { ZeitMintLaunchKit } from "./launch-kit.js";
import type { ReadinessReport } from "./readiness.js";
import type { ZeitMintUtilityManifest } from "./utility-manifest.js";
import {
  validateLaunchKit,
  validateReadinessReport,
  validateUtilityManifest,
  type ValidationIssue,
  type ValidationResult,
} from "./validate.js";

export type ZeitMintBundleInput = {
  launchKit: unknown;
  utilityManifest?: unknown;
  readinessReport?: unknown;
};

export type ZeitMintBundle = {
  launchKit: ZeitMintLaunchKit;
  utilityManifest?: ZeitMintUtilityManifest;
  readinessReport?: ReadinessReport;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function prefixIssues(prefix: string, issues: ValidationIssue[]) {
  return issues.map((issue) => ({
    ...issue,
    path: `${prefix}${issue.path === "/" ? "" : issue.path}` || prefix,
  }));
}

function sameText(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function validateBundle(input: unknown): ValidationResult<ZeitMintBundle> {
  if (!isRecord(input) || !("launchKit" in input)) {
    return {
      valid: false,
      issues: [{ path: "/launchKit", code: "required", message: "A launchKit is required." }],
    };
  }

  const launchResult = validateLaunchKit(input.launchKit);
  const utilityResult =
    input.utilityManifest === undefined
      ? undefined
      : validateUtilityManifest(input.utilityManifest);
  const readinessResult =
    input.readinessReport === undefined
      ? undefined
      : validateReadinessReport(input.readinessReport);
  const issues: ValidationIssue[] = [];

  if (!launchResult.valid) issues.push(...prefixIssues("/launchKit", launchResult.issues));
  if (utilityResult && !utilityResult.valid) {
    issues.push(...prefixIssues("/utilityManifest", utilityResult.issues));
  }
  if (readinessResult && !readinessResult.valid) {
    issues.push(...prefixIssues("/readinessReport", readinessResult.issues));
  }
  if (issues.length > 0 || !launchResult.valid) return { valid: false, issues };

  const launchKit = launchResult.value;
  const utilityManifest = utilityResult?.valid ? utilityResult.value : undefined;
  const readinessReport = readinessResult?.valid ? readinessResult.value : undefined;

  if (utilityManifest) {
    if (!sameText(launchKit.token.name, utilityManifest.project.name)) {
      issues.push({ path: "/utilityManifest/project/name", code: "bundle_mismatch", message: "Project name must match the Launch Kit." });
    }
    if (launchKit.token.symbol !== utilityManifest.project.symbol) {
      issues.push({ path: "/utilityManifest/project/symbol", code: "bundle_mismatch", message: "Ticker must match the Launch Kit." });
    }
    if (launchKit.handoff.preferredChain !== utilityManifest.project.chain) {
      issues.push({ path: "/utilityManifest/project/chain", code: "bundle_mismatch", message: "Chain must match the Launch Kit handoff." });
    }
  }

  if (readinessReport) {
    if (!sameText(launchKit.token.name, readinessReport.project.name)) {
      issues.push({ path: "/readinessReport/project/name", code: "bundle_mismatch", message: "Project name must match the Launch Kit." });
    }
    if (launchKit.token.symbol !== readinessReport.project.symbol) {
      issues.push({ path: "/readinessReport/project/symbol", code: "bundle_mismatch", message: "Ticker must match the Launch Kit." });
    }
    if (launchKit.handoff.preferredChain !== readinessReport.project.chain) {
      issues.push({ path: "/readinessReport/project/chain", code: "bundle_mismatch", message: "Chain must match the Launch Kit handoff." });
    }
  }

  if (issues.length > 0) return { valid: false, issues };
  return {
    valid: true,
    value: { launchKit, utilityManifest, readinessReport },
    issues: [],
  };
}

export function createPartnerHandoff(
  bundle: ZeitMintBundle,
  partner: string,
  generatedAt = new Date().toISOString(),
) {
  const readiness = bundle.readinessReport;
  return {
    handoffVersion: "1.0",
    generatedAt,
    source: { name: "ZeitMint", url: "https://zeitmint.com" },
    partner,
    token: {
      ...bundle.launchKit.token,
      artworkUrl: readiness?.project.artworkUrl || null,
    },
    links: {
      website: readiness?.project.website || null,
      x: readiness?.project.xUrl || null,
      telegram: readiness?.project.telegramUrl || null,
    },
    creative: bundle.launchKit.creative,
    campaign: bundle.launchKit.campaign,
    utility: bundle.utilityManifest?.utility ?? null,
    mission: bundle.utilityManifest?.mission ?? null,
    readiness: readiness
      ? { score: readiness.score, status: readiness.status, summary: readiness.summary }
      : null,
    preferences: {
      launchpad: bundle.launchKit.handoff.preferredLaunchpad,
      chain: bundle.launchKit.handoff.preferredChain,
    },
    review: {
      creatorApprovalRequired: true,
      requiresPartnerApproval: true,
      deploysToken: false,
      movesFunds: false,
    },
  } as const;
}
