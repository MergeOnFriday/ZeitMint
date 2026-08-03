export const LAUNCH_KIT_SCHEMA_URL = "https://zeitmint.com/launch-kit.schema.json";

export type LaunchKitConcept = {
  name: string;
  ticker: string;
  lane: string;
  hook: string;
  description: string;
  palette: string;
};

export type LaunchKitHandoff = {
  launchpad: "emblem" | "open-standard";
  chain: "solana" | "robinhood-chain" | "evm";
};

const defaultHandoff: LaunchKitHandoff = {
  launchpad: "emblem",
  chain: "solana",
};

export function buildLaunchKit(
  concept: LaunchKitConcept,
  handoff: LaunchKitHandoff = defaultHandoff,
) {
  return {
    $schema: LAUNCH_KIT_SCHEMA_URL,
    schemaVersion: "1.0",
    source: {
      name: "ZeitMint",
      url: "https://zeitmint.com",
    },
    token: {
      name: concept.name,
      symbol: concept.ticker,
      description: concept.description,
    },
    creative: {
      culturalLane: concept.lane,
      hook: concept.hook,
      artDirection: `${concept.palette} signal palette with an original, creator-reviewed identity`,
    },
    campaign: {
      posts: [
        `${concept.name} ($${concept.ticker}) is entering the timeline.`,
        concept.hook,
        "Created with ZeitMint · Prepared for a creator-led launch",
      ],
    },
    handoff: {
      mode: "launchpad-ready",
      preferredLaunchpad: handoff.launchpad,
      preferredChain: handoff.chain,
      integrationStatus:
        handoff.launchpad === "emblem" ? "partnership-target" : "open-standard",
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
