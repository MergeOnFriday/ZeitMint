import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import {
  buildLaunchKit,
  buildUtilityManifest,
  createLaunchpadDraft,
  createReadinessReport,
  validateBundle,
  validateLaunchpadDraftOptions,
  validateLaunchpadId,
  validateLaunchKit,
} from "../dist/index.js";

const concept = {
  name: "Artificial Doge",
  ticker: "AIDOGE",
  lane: "AI culture",
  hook: "The dog learned prompting.",
  description: "An original community project about AI-native internet culture and useful contributor missions.",
  palette: "chrome and lime",
};

function buildValidBundle() {
  const launchKit = buildLaunchKit(concept, { launchpad: "example-launchpad", chain: "solana" });
  const utilityManifest = buildUtilityManifest(
    {
      projectName: concept.name,
      symbol: concept.ticker,
      chain: "solana",
      preferredLaunchpad: "example-launchpad",
      title: "Create an open community asset library",
      deliverable: "Design and document ten original reusable community assets with editable source files.",
      submissionRequirements: "Include source files, licenses and a public preview link.",
      rewardAmount: "500",
      rewardAsset: "USDC",
      bonusAmount: "",
      bonusAsset: "",
      deadline: "2099-12-31",
      fundingSource: "creator-funded",
      fundingStatus: "planned",
      approval: "creator-review",
      originalWorkRequired: true,
      engagementFarmingProhibited: true,
    },
    "2026-08-03T12:00:00.000Z",
  );
  const readinessReport = createReadinessReport(
    {
      name: concept.name,
      symbol: concept.ticker,
      description: concept.description,
      website: "https://example.com",
      xUrl: "https://x.com/example",
      telegramUrl: "https://t.me/example",
      artworkUrl: "https://example.com/logo.png",
      chain: "solana",
      launchpad: "example-launchpad",
      originalIdentityConfirmed: true,
      noReturnsPromised: true,
      creatorControlsProject: true,
    },
    "2026-08-03T12:00:00.000Z",
  );
  return { launchKit, utilityManifest, readinessReport };
}

test("validates a complete, consistent bundle", () => {
  const result = validateBundle(buildValidBundle());
  assert.equal(result.valid, true);
  assert.equal(result.value.launchKit.token.symbol, "AIDOGE");
});

test("returns stable issues for invalid input", () => {
  const result = validateLaunchKit({ schemaVersion: "1.0" });
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === "required"));
});

test("rejects cross-document ticker mismatches", () => {
  const input = buildValidBundle();
  const utilityManifest = structuredClone(input.utilityManifest);
  utilityManifest.project.symbol = "OTHER";
  const result = validateBundle({ ...input, utilityManifest });
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === "bundle_mismatch"));
});

test("maps a valid bundle into a universal launchpad review draft", () => {
  const result = validateBundle(buildValidBundle());
  assert.equal(result.valid, true);
  const draft = createLaunchpadDraft(result.value, "example-launchpad", {
    chain: "solana",
    launchType: "pool",
    extensions: { partnerField: "partner-owned" },
  });
  assert.equal(draft.review.readyForPartnerReview, true);
  assert.equal(draft.review.deploysToken, false);
  assert.equal(draft.profile.targetLaunchpad, "example-launchpad");
  assert.equal(draft.profile.submissionStatus, "partner-controlled");
  assert.equal(draft.extensions.partnerField, "partner-owned");
});

test("validates fee intent without assuming partner approval", () => {
  assert.equal(validateLaunchpadDraftOptions({ feeIntent: { graduationFeeBps: 250 } }).valid, true);
  assert.equal(validateLaunchpadDraftOptions({ feeIntent: { graduationFeeBps: 10_001 } }).valid, false);
  assert.equal(validateLaunchpadId("any-launchpad").valid, true);
  assert.equal(validateLaunchpadId("Not A Slug").valid, false);
});

test("ships a CommonJS entry point", () => {
  const require = createRequire(import.meta.url);
  const sdk = require("../dist/index.cjs");
  assert.equal(typeof sdk.validateBundle, "function");
});
