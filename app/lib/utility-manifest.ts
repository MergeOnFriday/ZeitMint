export const UTILITY_MANIFEST_SCHEMA_URL =
  "https://zeitmint.com/utility-manifest.schema.json";

export type UtilityChain = "solana" | "robinhood-chain" | "evm";
export type UtilityFundingSource =
  | "creator-funded"
  | "community-treasury"
  | "programmable-fees";
export type UtilityApproval = "creator-review" | "community-vote" | "hybrid";

export type UtilityMissionInput = {
  projectName: string;
  symbol: string;
  chain: UtilityChain;
  preferredLaunchpad: "emblem" | "open-standard";
  title: string;
  deliverable: string;
  submissionRequirements: string;
  rewardAmount: string;
  rewardAsset: string;
  bonusAmount: string;
  bonusAsset: string;
  deadline: string;
  fundingSource: UtilityFundingSource;
  fundingStatus: "planned" | "self-declared-funded";
  approval: UtilityApproval;
  originalWorkRequired: boolean;
  engagementFarmingProhibited: boolean;
};

export type UtilityMissionIssue = {
  field: keyof UtilityMissionInput | "content";
  message: string;
};

const engagementFarmingPattern =
  /\b(like\s+and\s+retweet|retweet|repost|raid|shill|buy\s+(the\s+)?token|pump\s+(the\s+)?token)\b/i;

function positiveAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export function validateUtilityMission(
  input: UtilityMissionInput,
  now = new Date(),
): UtilityMissionIssue[] {
  const issues: UtilityMissionIssue[] = [];
  const symbol = input.symbol.trim().toUpperCase();
  const deadline = new Date(`${input.deadline}T23:59:59Z`);

  if (input.projectName.trim().length < 2) {
    issues.push({ field: "projectName", message: "Add a project name." });
  }
  if (!/^[A-Z0-9]{2,10}$/.test(symbol)) {
    issues.push({
      field: "symbol",
      message: "Use a 2–10 character ticker without spaces or a $ prefix.",
    });
  }
  if (input.title.trim().length < 8) {
    issues.push({ field: "title", message: "Give the mission a clear title." });
  }
  if (input.deliverable.trim().length < 40) {
    issues.push({
      field: "deliverable",
      message: "Describe the useful work and expected deliverable in at least 40 characters.",
    });
  }
  if (input.submissionRequirements.trim().length < 20) {
    issues.push({
      field: "submissionRequirements",
      message: "Explain what a valid submission must include.",
    });
  }
  if (!positiveAmount(input.rewardAmount) || !input.rewardAsset.trim()) {
    issues.push({
      field: "rewardAmount",
      message: "Add a positive primary reward and its asset.",
    });
  }
  if (
    (input.bonusAmount.trim() && !positiveAmount(input.bonusAmount)) ||
    (input.bonusAmount.trim() && !input.bonusAsset.trim())
  ) {
    issues.push({
      field: "bonusAmount",
      message: "Complete both optional bonus fields or leave both empty.",
    });
  }
  if (!input.deadline || Number.isNaN(deadline.getTime()) || deadline <= now) {
    issues.push({ field: "deadline", message: "Choose a future deadline." });
  }
  if (!input.originalWorkRequired) {
    issues.push({
      field: "originalWorkRequired",
      message: "Require original work before generating the manifest.",
    });
  }
  if (!input.engagementFarmingProhibited) {
    issues.push({
      field: "engagementFarmingProhibited",
      message: "Confirm that the mission does not reward manufactured engagement.",
    });
  }
  if (engagementFarmingPattern.test(`${input.title} ${input.deliverable}`)) {
    issues.push({
      field: "content",
      message: "Rewrite the mission around useful work—not buying, shilling, raids or reposts.",
    });
  }

  return issues;
}

export function buildUtilityManifest(
  input: UtilityMissionInput,
  generatedAt = new Date().toISOString(),
) {
  const projectName = input.projectName.trim();
  const symbol = input.symbol.trim().toUpperCase();
  const title = input.title.trim();
  const missionId = `${slugify(projectName)}-${slugify(title)}` || "utility-mission";

  return {
    $schema: UTILITY_MANIFEST_SCHEMA_URL,
    schemaVersion: "1.0",
    generatedAt,
    source: { name: "ZeitMint", url: "https://zeitmint.com" },
    project: {
      name: projectName,
      symbol,
      chain: input.chain,
    },
    utility: {
      type: "community-bounties",
      objective: "fund-contributors",
      userAction: "submit-original-work",
      benefit: "approved-contribution-reward",
      status: "draft",
    },
    mission: {
      id: missionId,
      title,
      deliverable: input.deliverable.trim(),
      submissionRequirements: input.submissionRequirements.trim(),
      deadline: input.deadline,
      reward: {
        primary: {
          amount: input.rewardAmount.trim(),
          asset: input.rewardAsset.trim().toUpperCase(),
        },
        bonus:
          input.bonusAmount.trim() && input.bonusAsset.trim()
            ? {
                amount: input.bonusAmount.trim(),
                asset: input.bonusAsset.trim().toUpperCase(),
              }
            : null,
      },
      funding: {
        source: input.fundingSource,
        status: input.fundingStatus,
        verification: "self-declared",
      },
      approval: input.approval,
    },
    integrity: {
      originalWorkRequired: true,
      engagementFarmingProhibited: true,
      automatedPayout: false,
      rewardCustody: "outside-zeitmint",
      utilityProof: "unverified-until-completion",
    },
    handoff: {
      preferredLaunchpad: input.preferredLaunchpad,
      preferredChain: input.chain,
      launchpadControls: [
        "token contract",
        "tokenomics",
        "liquidity",
        "deployment",
      ],
    },
  } as const;
}

export type ZeitMintUtilityManifest = ReturnType<typeof buildUtilityManifest>;
