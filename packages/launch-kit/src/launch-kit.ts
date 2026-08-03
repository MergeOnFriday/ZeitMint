export const LAUNCH_KIT_SCHEMA_URL = "https://zeitmint.com/launch-kit.schema.json";

export type ZeitMintChain = "solana" | "robinhood-chain" | "evm";
export type ZeitMintLaunchpad = "emblem" | "based-bid" | "open-standard";

export type LaunchKitConcept = {
  name: string;
  ticker: string;
  lane: string;
  hook: string;
  description: string;
  palette: string;
};

export type LaunchKitHandoff = {
  launchpad: ZeitMintLaunchpad;
  chain: ZeitMintChain;
};

const defaultHandoff: LaunchKitHandoff = {
  launchpad: "emblem",
  chain: "solana",
};

export function buildLaunchKit(
  concept: LaunchKitConcept,
  handoff: LaunchKitHandoff = defaultHandoff,
) {
  const integrationStatus =
    handoff.launchpad === "emblem"
      ? "partnership-target"
      : handoff.launchpad === "based-bid"
        ? "integration-candidate"
        : "open-standard";

  return {
    $schema: LAUNCH_KIT_SCHEMA_URL,
    schemaVersion: "1.0",
    source: {
      name: "ZeitMint",
      url: "https://zeitmint.com",
    },
    token: {
      name: concept.name.trim(),
      symbol: concept.ticker.trim().toUpperCase(),
      description: concept.description.trim(),
    },
    creative: {
      culturalLane: concept.lane.trim(),
      hook: concept.hook.trim(),
      artDirection: `${concept.palette.trim()} signal palette with an original, creator-reviewed identity`,
    },
    campaign: {
      posts: [
        `${concept.name.trim()} ($${concept.ticker.trim().toUpperCase()}) is entering the timeline.`,
        concept.hook.trim(),
        "Created with ZeitMint · Prepared for a creator-led launch",
      ],
    },
    handoff: {
      mode: "launchpad-ready",
      preferredLaunchpad: handoff.launchpad,
      preferredChain: handoff.chain,
      integrationStatus,
      launchpadControls: [
        "chain",
        "token contract",
        "supply and tokenomics",
        "liquidity",
        "deployment",
      ],
    },
    review: {
      creatorApprovalRequired: true,
      promisesReturns: false,
      deploysToken: false,
    },
  } as const;
}

export type ZeitMintLaunchKit = ReturnType<typeof buildLaunchKit>;
