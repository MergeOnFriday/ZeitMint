"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createWalletClient,
  custom,
  defineChain,
  isAddress,
  keccak256,
  toBytes,
  type Address,
  type EIP1193Provider,
} from "viem";
import {
  buildLaunchKit,
  LAUNCH_KIT_SCHEMA_URL,
  type LaunchKitHandoff,
} from "./lib/launch-kit";
import LaunchValidator from "./launch-validator";
import UtilityBuilder from "./utility-builder";

type Mode = "Now" | "Throwback" | "Hybrid";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Testnet Explorer",
      url: "https://explorer.testnet.chain.robinhood.com",
    },
  },
  testnet: true,
});

const creativeKitRegistryAbi = [
  {
    type: "function",
    name: "registerCreativeKit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "contentHash", type: "bytes32" },
      { name: "concept", type: "string" },
      { name: "uri", type: "string" },
    ],
    outputs: [{ name: "kitId", type: "bytes32" }],
  },
] as const;

const configuredRegistryAddress = process.env.NEXT_PUBLIC_RH_REGISTRY_ADDRESS;

type Concept = {
  name: string;
  ticker: string;
  score: number;
  lane: string;
  hook: string;
  description: string;
  palette: string;
};

const concepts: Record<Mode, Concept[]> = {
  Now: [
    {
      name: "Sunday Scaries",
      ticker: "SCARY",
      score: 94,
      lane: "Work culture",
      hook: "The weekend is down only.",
      description:
        "A weekly internet ritual turned into a self-aware coin for everyone watching Monday approach.",
      palette: "violet",
    },
    {
      name: "Scroll Tax",
      ticker: "SCROLL",
      score: 91,
      lane: "Internet life",
      hook: "You looked. You owe.",
      description:
        "A coin for the invisible fee we all pay every time five minutes becomes fifty.",
      palette: "blue",
    },
    {
      name: "Main Character",
      ticker: "PLOT",
      score: 89,
      lane: "Social culture",
      hook: "The timeline revolves around you.",
      description:
        "A playful salute to main-character energy, plot twists and posting through it.",
      palette: "coral",
    },
  ],
  Throwback: [
    {
      name: "Dial Up Dog",
      ticker: "MODEM",
      score: 92,
      lane: "Internet nostalgia",
      hook: "Connected eventually.",
      description:
        "A pixel-era pup for everyone who remembers when going online had a soundtrack.",
      palette: "blue",
    },
    {
      name: "Rage Quit Kid",
      ticker: "RAGE",
      score: 90,
      lane: "Gaming nostalgia",
      hook: "Alt. F4. Repeat.",
      description:
        "A loving callback to early reaction memes, broken keyboards and glorious overreactions.",
      palette: "coral",
    },
    {
      name: "Forum Legend",
      ticker: "OP",
      score: 87,
      lane: "Web 1.0",
      hook: "First post. Last word.",
      description:
        "For avatars, signatures, flame wars and the people who were online before it was content.",
      palette: "violet",
    },
  ],
  Hybrid: [
    {
      name: "Artificial Doge",
      ticker: "AIDOGE",
      score: 97,
      lane: "AI × 2021 nostalgia",
      hook: "Much model. Very synthetic.",
      description:
        "The original internet-dog grammar meets the age of agents, prompts and synthetic everything.",
      palette: "lime",
    },
    {
      name: "Pepe Has Logged On",
      ticker: "ONLINE",
      score: 95,
      lane: "Classic meme × now",
      hook: "The timeline felt it.",
      description:
        "A fresh, original amphibian archetype for the permanently online—not a copy of an existing project.",
      palette: "blue",
    },
    {
      name: "Bonk To The Future",
      ticker: "BTTF",
      score: 93,
      lane: "Solana × retro future",
      hook: "Where we’re going, we still need memes.",
      description:
        "A retro-futurist wink to the Solana cycle with chrome type, laser grids and zero promises.",
      palette: "violet",
    },
  ],
};

const pulseItems = [
  ["IDENTITY", "CLEAR"],
  ["NARRATIVE", "OWNABLE"],
  ["PRESENCE", "LIVE"],
  ["SAFETY", "DECLARED"],
  ["HANDOFF", "PORTABLE"],
];

const chainOptions: Array<{
  value: LaunchKitHandoff["chain"];
  label: string;
  note: string;
}> = [
  { value: "solana", label: "Solana", note: "Default" },
  { value: "robinhood-chain", label: "Robinhood Chain", note: "EVM" },
  { value: "evm", label: "Other EVM", note: "Portable" },
];

const sdkInstallCommand = "npm install @zeitmint/launch-kit";

const sdkIntegrationExample = `import {
  createLaunchpadDraft,
  validateBundle,
} from "@zeitmint/launch-kit";

const payload = await request.json();
const result = validateBundle(payload);

if (!result.valid) {
  return Response.json(
    { issues: result.issues },
    { status: 422 },
  );
}

const draft = createLaunchpadDraft(
  result.value,
  "your-launchpad",
  { chain: "solana", launchType: "pool" },
);

// Partner reviews and submits the draft.
return Response.json({ draft });`;

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      ZM
    </span>
  );
}

export default function ZeitMintApp() {
  const [mode, setMode] = useState<Mode>("Hybrid");
  const [generatedMode, setGeneratedMode] = useState<Mode>("Hybrid");
  const [selected, setSelected] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [walletAddress, setWalletAddress] = useState<Address>();
  const [walletPending, setWalletPending] = useState(false);
  const [walletMessage, setWalletMessage] = useState("");
  const [registryPending, setRegistryPending] = useState(false);
  const [registryTransaction, setRegistryTransaction] = useState<`0x${string}`>();
  const [targetLaunchpad, setTargetLaunchpad] =
    useState<LaunchKitHandoff["launchpad"]>("emblem");
  const [targetChain, setTargetChain] =
    useState<LaunchKitHandoff["chain"]>("solana");
  const [handoffMessage, setHandoffMessage] = useState("");
  const [waitlistMessage, setWaitlistMessage] = useState("");
  const [waitlistPending, setWaitlistPending] = useState(false);
  const [partnerMessage, setPartnerMessage] = useState("");

  useEffect(() => {
    const storageKey = "zeitmint:visitor-notified";

    try {
      if (window.sessionStorage.getItem(storageKey)) return;
      window.sessionStorage.setItem(storageKey, "pending");
    } catch {
      // Some privacy modes disable session storage; the request can still proceed.
    }

    let referrer = "Direct";
    if (document.referrer) {
      try {
        referrer = new URL(document.referrer).hostname || "Direct";
      } catch {
        referrer = "Direct";
      }
    }

    void fetch("/api/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: window.location.pathname,
        referrer,
      }),
      keepalive: true,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Visit notification failed.");
        try {
          window.sessionStorage.setItem(storageKey, "sent");
        } catch {}
      })
      .catch(() => {
        try {
          window.sessionStorage.removeItem(storageKey);
        } catch {}
      });
  }, []);

  const activeConcepts = concepts[generatedMode];
  const activeConcept = activeConcepts[selected];

  const launchKit = useMemo(
    () =>
      buildLaunchKit(activeConcept, {
        launchpad: targetLaunchpad,
        chain: targetChain,
      }),
    [activeConcept, targetChain, targetLaunchpad],
  );
  const socialPosts = launchKit.campaign.posts;

  function generate() {
    setIsGenerating(true);
    window.setTimeout(() => {
      setGeneratedMode(mode);
      setSelected(0);
      setIsGenerating(false);
      document
        .getElementById("concept-results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 650);
  }

  function downloadLaunchKit() {
    const file = new Blob([`${JSON.stringify(launchKit, null, 2)}\n`], {
      type: "application/json",
    });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `zeitmint-${activeConcept.ticker.toLowerCase()}-${targetChain}-launch-kit.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setHandoffMessage("Launch kit downloaded. Import or attach it wherever you launch.");
  }

  async function copyLaunchpadBrief() {
    const launchpadName = targetLaunchpad === "emblem" ? "Emblem" : "Open standard";
    const chainName = chainOptions.find((option) => option.value === targetChain)?.label;
    const brief = [
      `${activeConcept.name} ($${activeConcept.ticker})`,
      activeConcept.description,
      `Hook: ${activeConcept.hook}`,
      `Cultural lane: ${activeConcept.lane}`,
      `Preferred launchpad: ${launchpadName}`,
      `Preferred chain: ${chainName}`,
      "Launchpad controls: chain, contract, tokenomics, liquidity and deployment.",
      "Source: ZeitMint Launch Kit v1",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(brief);
      setHandoffMessage("Launchpad brief copied to your clipboard.");
    } catch {
      setHandoffMessage("Clipboard access was blocked. Download the JSON kit instead.");
    }
  }

  async function copyPartnerIntro() {
    const showcaseUrl = `${window.location.origin}${window.location.pathname}#sdk`;
    const intro = [
      "Hey — I’m building ZeitMint, the creative layer before a token launch.",
      "",
      "Creators get launch-readiness checks, a differentiated identity, a community mission and structured manifests. Launchpads get a tested, non-custodial SDK, versioned schemas and a stateless validation API with Solana as the default and EVM support built in.",
      "",
      "The universal SDK is ready for partner testing. Any launchpad can map the same neutral handoff into its own flow, while Emblem remains our preferred design-partner target.",
      "",
      `SDK showcase: ${showcaseUrl}`,
      "Contact: devs@zeitmint.com",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(intro);
      setPartnerMessage("Partner intro copied. Ready to send.");
    } catch {
      setPartnerMessage("Clipboard access was blocked. Email devs@zeitmint.com instead.");
    }
  }

  async function getRobinhoodWalletClient() {
    if (!window.ethereum) {
      throw new Error("Install an EVM wallet such as Robinhood Wallet or MetaMask first.");
    }

    const client = createWalletClient({
      chain: robinhoodTestnet,
      transport: custom(window.ethereum),
    });

    try {
      await client.switchChain({ id: robinhoodTestnet.id });
    } catch (error) {
      const switchError = error as { code?: number; cause?: { code?: number } };
      if ((switchError.cause?.code ?? switchError.code) !== 4902) throw error;
      await client.addChain({ chain: robinhoodTestnet });
    }

    return client;
  }

  async function connectRobinhoodWallet() {
    setWalletPending(true);
    setWalletMessage("");
    setRegistryTransaction(undefined);

    try {
      const client = await getRobinhoodWalletClient();
      const [address] = await client.requestAddresses();
      if (!address) throw new Error("The wallet did not return an account.");
      setWalletAddress(address);
      setWalletMessage(`Connected ${address.slice(0, 6)}…${address.slice(-4)} on testnet.`);
    } catch (error) {
      setWalletAddress(undefined);
      setWalletMessage(error instanceof Error ? error.message : "Wallet connection failed.");
    } finally {
      setWalletPending(false);
    }
  }

  async function registerCreativeKit() {
    if (!walletAddress) {
      setWalletMessage("Connect a Robinhood Chain testnet wallet first.");
      return;
    }

    if (!configuredRegistryAddress || !isAddress(configuredRegistryAddress)) {
      setWalletMessage("The registry contract is ready but has not been deployed to testnet yet.");
      return;
    }

    setRegistryPending(true);
    setWalletMessage("");

    try {
      const client = await getRobinhoodWalletClient();
      const contentHash = keccak256(toBytes(JSON.stringify(launchKit)));
      const transactionHash = await client.writeContract({
        account: walletAddress,
        address: configuredRegistryAddress,
        abi: creativeKitRegistryAbi,
        functionName: "registerCreativeKit",
        args: [contentHash, activeConcept.name, LAUNCH_KIT_SCHEMA_URL],
      });
      setRegistryTransaction(transactionHash);
      setWalletMessage("Creative-kit proof submitted to Robinhood Chain testnet.");
    } catch (error) {
      setWalletMessage(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setRegistryPending(false);
    }
  }

  async function submitWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setWaitlistPending(true);
    const form = new FormData(formElement);
    const email = String(form.get("email") || "");
    if (!email.includes("@")) {
      setWaitlistMessage("Enter a valid email to join.");
      setWaitlistPending(false);
      return;
    }

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          company: String(form.get("company") || ""),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Signup failed.");
      setWaitlistMessage("You’re on the founding list. We’ll be in touch.");
      formElement.reset();
    } catch (error) {
      setWaitlistMessage(error instanceof Error ? error.message : "Signup failed.");
    } finally {
      setWaitlistPending(false);
    }
  }

  return (
    <main>
      <nav className="nav-shell" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="ZeitMint home">
          <BrandMark />
          <span>ZeitMint</span>
        </a>
        <div className="nav-links">
          <a href="#validator">Validator</a>
          <a href="#studio">Studio</a>
          <a href="#utility">Utility</a>
          <a href="#sdk">For launchpads</a>
        </div>
        <a className="button button-small button-ghost" href="#validator">
          Check a project <span>↗</span>
        </a>
      </nav>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-orbit orbit-one" aria-hidden="true" />
        <div className="hero-orbit orbit-two" aria-hidden="true" />
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" /> Free launch-readiness validator
          </div>
          <h1>
            Make it
            <br />
            <span>launch-ready.</span>
          </h1>
          <p>
            Validate the identity, links, narrative and creator declarations
            behind a token project—then package it for Emblem, Solana or the EVM
            launch workflow you choose.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#validator">
              Check my project <span>↗</span>
            </a>
            <a className="text-link" href="#studio">
              Explore the creative studio <span>↓</span>
            </a>
          </div>
          <div className="trust-row">
            <span>Structural preflight</span>
            <strong>10 checks</strong>
            <i />
            <span>Portable handoff</span>
            <strong>Launch Kit v1</strong>
          </div>
          <p className="affiliation-note">
            Emblem is our partnership target, not a current endorsement or affiliation.
          </p>
        </div>

        <div className="hero-card-wrap" aria-label="Example ZeitMint launch-readiness report">
          <div className="readiness-card">
            <div className="readiness-card-top">
              <span>LAUNCH PREFLIGHT / LIVE</span>
              <span className="signal-badge">NEARLY READY</span>
            </div>
            <div className="readiness-score-visual">
              <div className="readiness-dial">
                <strong>85</strong>
                <span>/100</span>
              </div>
              <div>
                <span>ARTIFICIAL DOGE</span>
                <h2>2 fixes before handoff.</h2>
                <p>Solana · Emblem-ready format</p>
              </div>
            </div>
            <div className="readiness-mini-checks">
              <span><i>✓</i><strong>Identity</strong><small>Ready</small></span>
              <span><i>✓</i><strong>Narrative</strong><small>Ready</small></span>
              <span className="needs-fix"><i>!</i><strong>Artwork URL</strong><small>Missing</small></span>
              <span className="needs-fix"><i>·</i><strong>Telegram</strong><small>Warning</small></span>
            </div>
            <div className="readiness-card-foot">
              <span>CREATOR CONTROLLED</span>
              <strong>EXPORTABLE JSON ↗</strong>
            </div>
          </div>
          <div className="float-tag float-tag-one">Emblem handoff: structured</div>
          <div className="float-tag float-tag-two">Solana: default</div>
        </div>
      </section>

      <div className="pulse-strip" aria-label="Launch readiness framework">
        <span className="pulse-label">READINESS FRAMEWORK</span>
        <div className="pulse-items">
          {pulseItems.map(([label, value]) => (
            <span key={label}>
              {label} <em>{value}</em>
            </span>
          ))}
        </div>
      </div>

      <LaunchValidator />

      <section className="studio section-shell" id="studio">
        <div className="section-heading">
          <div>
            <span className="section-index">02 / THE CREATIVE STUDIO</span>
            <h2>Which cultural opening is worth building?</h2>
          </div>
          <p>
            Once the project foundation is clear, use the creative demo to
            compare three directions and build a stronger launch identity.
          </p>
        </div>

        <div className="mode-picker" role="radiogroup" aria-label="Concept mode">
          {(["Now", "Throwback", "Hybrid"] as Mode[]).map((item) => (
            <button
              className={mode === item ? "mode-card active" : "mode-card"}
              key={item}
              onClick={() => setMode(item)}
              role="radio"
              aria-checked={mode === item}
            >
              <span>{item === "Now" ? "◷" : item === "Throwback" ? "↶" : "✦"}</span>
              <strong>{item}</strong>
              <small>
                {item === "Now"
                  ? "What the internet is talking about today."
                  : item === "Throwback"
                    ? "A fresh wink to an earlier meme era."
                    : "Current energy with nostalgic internet DNA."}
              </small>
            </button>
          ))}
        </div>

        <div className="studio-controls">
          <label>
            CULTURE LANE
            <select defaultValue="Internet culture" aria-label="Culture lane">
              <option>Internet culture</option>
              <option>Crypto culture</option>
              <option>Entertainment</option>
              <option>Gaming</option>
              <option>Work & daily life</option>
            </select>
          </label>
          <label>
            ENERGY
            <select defaultValue="Clever, self-aware" aria-label="Concept energy">
              <option>Clever, self-aware</option>
              <option>Chaotic, absurd</option>
              <option>Cute, collectible</option>
              <option>Retro, cultish</option>
            </select>
          </label>
          <button className="button button-primary generate-button" onClick={generate}>
            {isGenerating ? "Reading the moment…" : "Develop 3 directions"}
            <span>{isGenerating ? "◌" : "✦"}</span>
          </button>
        </div>

        <div className="concept-results" id="concept-results">
          <div className="results-header">
            <div>
              <span className="status-dot" /> CREATIVE REVIEW COMPLETE
            </div>
            <span>3 curated directions · {generatedMode} mode</span>
          </div>
          <div className="concept-grid">
            {activeConcepts.map((concept, index) => (
              <button
                className={selected === index ? "concept-card selected" : "concept-card"}
                key={concept.name}
                onClick={() => {
                  setSelected(index);
                  setHandoffMessage("");
                }}
                aria-pressed={selected === index}
              >
                <div className={`mini-art ${concept.palette}`}>
                  <span>{concept.ticker.slice(0, 2)}</span>
                  <i>✦</i>
                </div>
                <div className="concept-meta">
                  <span>{concept.lane}</span>
                  <strong>{concept.score}</strong>
                </div>
                <h3>{concept.name}</h3>
                <p className="ticker">${concept.ticker}</p>
                <p>{concept.hook}</p>
                <span className="select-label">
                  {selected === index ? "Selected ✓" : "Select concept"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="launch-builder">
          <div className="launch-preview">
            <span className="section-index">SELECTED CONCEPT</span>
            <div className={`large-art ${activeConcept.palette}`}>
              <span>{activeConcept.ticker.slice(0, 2)}</span>
              <i>✦</i>
              <b>{activeConcept.score}</b>
            </div>
            <div className="launch-title">
              <div>
                <h3>{activeConcept.name}</h3>
                <span>${activeConcept.ticker}</span>
              </div>
              <span className="clear-badge">DISTINCT</span>
            </div>
            <p>{activeConcept.description}</p>
            <div className="differentiation-grid" aria-label="Illustrative differentiation review">
              <span><small>Timing</small><strong>Strong</strong></span>
              <span><small>Audience</small><strong>Clear</strong></span>
              <span><small>Story</small><strong>Ownable</strong></span>
              <span><small>Identity</small><strong>Distinct</strong></span>
            </div>
          </div>

          <div className="launch-kit">
            <span className="section-index">YOUR MULTICHAIN LAUNCH KIT</span>
            <h3>Built for Emblem. Ready to travel.</h3>
            <ul>
              <li><span>01</span> Cultural timing and audience angle</li>
              <li><span>02</span> Standardized name, ticker and metadata</li>
              <li><span>03</span> Original art direction, lore and hook</li>
              <li><span>04</span> Creator-reviewed safety notes</li>
              <li><span>05</span> Emblem-ready brief and portable JSON</li>
            </ul>
            <div className="social-draft">
              {socialPosts.map((post) => (
                <p key={post}>{post}</p>
              ))}
            </div>
          </div>

          <div className="handoff-card">
            <span className="section-index">EMBLEM-FIRST HANDOFF</span>
            <h3>Emblem first. Chain flexible.</h3>
            <p className="handoff-intro">
              ZeitMint is designed to feed a stronger creative package into Emblem
              Build + Launchpad. Until a direct partnership lands, the same kit
              stays portable and creator controlled.
            </p>
            <div className="handoff-picker" role="radiogroup" aria-label="Preferred launchpad">
              <span className="picker-label">PREFERRED LAUNCHPAD</span>
              <div>
                <button
                  className={targetLaunchpad === "emblem" ? "active" : ""}
                  onClick={() => {
                    setTargetLaunchpad("emblem");
                    setHandoffMessage("");
                  }}
                  role="radio"
                  aria-checked={targetLaunchpad === "emblem"}
                >
                  <strong>Emblem</strong>
                  <small>Primary target</small>
                </button>
                <button
                  className={targetLaunchpad === "open-standard" ? "active" : ""}
                  onClick={() => {
                    setTargetLaunchpad("open-standard");
                    setHandoffMessage("");
                  }}
                  role="radio"
                  aria-checked={targetLaunchpad === "open-standard"}
                >
                  <strong>Open format</strong>
                  <small>Any launchpad</small>
                </button>
              </div>
            </div>
            <div className="handoff-picker chain-handoff" role="radiogroup" aria-label="Preferred chain">
              <span className="picker-label">PREFERRED CHAIN</span>
              <div>
                {chainOptions.map((option) => (
                  <button
                    className={targetChain === option.value ? "active" : ""}
                    key={option.value}
                    onClick={() => {
                      setTargetChain(option.value);
                      setHandoffMessage("");
                    }}
                    role="radio"
                    aria-checked={targetChain === option.value}
                  >
                    <strong>{option.label}</strong>
                    <small>{option.note}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="handoff-status" aria-label="Launch kit compatibility">
              <span><strong>Emblem-ready brief</strong><small>Available now</small></span>
              <span><strong>Universal JSON</strong><small>Available now</small></span>
              <span><strong>Direct Emblem adapter</strong><small>Partnership target</small></span>
            </div>
            <button className="button button-primary" onClick={downloadLaunchKit}>
              Download {targetLaunchpad === "emblem" ? "Emblem-ready" : "universal"} kit <span>↓</span>
            </button>
            <button className="button button-dark" onClick={copyLaunchpadBrief}>
              Copy {targetLaunchpad === "emblem" ? "Emblem" : "launchpad"} brief <span>↗</span>
            </button>
            {handoffMessage ? (
              <p className="handoff-message" aria-live="polite">{handoffMessage}</p>
            ) : null}
            <a
              className="schema-link"
              href="/launch-kit.schema.json"
              target="_blank"
              rel="noreferrer"
            >
              View the open Launch Kit v1 schema ↗
            </a>

            <details className="provenance-panel">
              <summary>
                <span>OPTIONAL PROVENANCE EXPERIMENT</span>
                <strong>Robinhood testnet +</strong>
              </summary>
              <div className="provenance-body">
                <p>
                  Register the kit hash as a creator-owned receipt. This is an
                  optional multichain tool—not ZeitMint’s main launch path.
                </p>
                <button
                  className={walletAddress ? "button button-connected" : "button button-ghost"}
                  onClick={connectRobinhoodWallet}
                  disabled={walletPending}
                >
                  {walletPending
                    ? "Connecting…"
                    : walletAddress
                      ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)} connected ✓`
                      : "Connect testnet wallet"}
                </button>
                <button
                  className="button button-primary"
                  onClick={registerCreativeKit}
                  disabled={!walletAddress || registryPending || !configuredRegistryAddress}
                >
                  {registryPending
                    ? "Submitting proof…"
                    : configuredRegistryAddress
                      ? "Register provenance proof ↗"
                      : "Registry deployment pending"}
                </button>
                {walletMessage ? <p className="wallet-message" aria-live="polite">{walletMessage}</p> : null}
                {registryTransaction ? (
                  <a
                    className="explorer-link"
                    href={`https://explorer.testnet.chain.robinhood.com/tx/${registryTransaction}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View testnet transaction ↗
                  </a>
                ) : null}
                <small>
                  Testnet only. Independent integration; no Robinhood endorsement.
                  Private keys never leave your wallet.
                </small>
              </div>
            </details>
          </div>
        </div>
      </section>

      <UtilityBuilder />

      <section className="sdk-showcase section-shell" id="sdk">
        <div className="sdk-heading">
          <div>
            <span className="section-index">04 / FOR LAUNCHPADS</span>
            <span className="sdk-status"><i /> SDK v0.2 · UNIVERSAL HANDOFF</span>
            <h2>One creative format.<br />Any launch workflow.</h2>
          </div>
          <div className="sdk-heading-copy">
            <p>
              <strong>@zeitmint/launch-kit</strong> now ships typed builders,
              JSON Schema validation, bundle consistency checks and a universal
              launchpad handoff in ESM and CommonJS. No custody, deployment or liquidity
              logic is hidden inside it.
            </p>
            <div className="sdk-actions">
              <a className="button button-primary" href="mailto:devs@zeitmint.com?subject=ZeitMint%20SDK%20integration">
                Start partner testing <span>↗</span>
              </a>
              <a className="text-link light-link" href="/partner-api.json" target="_blank" rel="noreferrer">
                Inspect Partner API <span>↗</span>
              </a>
            </div>
          </div>
        </div>

        <div className="sdk-workbench">
          <div className="sdk-code-card">
            <div className="sdk-window-bar">
              <span><i /><i /><i /></span>
              <strong>launchpad-adapter.ts</strong>
              <small>TESTED API</small>
            </div>
            <div className="sdk-install-row">
              <span>$</span>
              <code>{sdkInstallCommand}</code>
              <small>PUBLIC NPM PACKAGE</small>
            </div>
            <pre aria-label="ZeitMint SDK integration example"><code>{sdkIntegrationExample}</code></pre>
          </div>

          <div className="sdk-payload-card">
            <div className="payload-heading">
              <span>LAUNCH + UTILITY + READINESS</span>
              <strong>SCHEMA VALID</strong>
            </div>
            <div className="payload-token">
              <div className="payload-mark">AI</div>
              <div>
                <small>TOKEN METADATA</small>
                <h3>Artificial Doge</h3>
                <span>$AIDOGE</span>
              </div>
            </div>
            <dl className="payload-fields">
              <div><dt>profile</dt><dd>launchpad-handoff</dd></div>
              <div><dt>preferredChain</dt><dd>solana</dd></div>
              <div><dt>utility.type</dt><dd>community-bounties</dd></div>
              <div><dt>creatorApproval</dt><dd>true</dd></div>
              <div><dt>deploysToken</dt><dd>false</dd></div>
            </dl>
            <p>A review-ready partner draft with explicit missing fields and intent-only fee settings—without taking control away from the launchpad.</p>
          </div>
        </div>

        <div className="sdk-flow" aria-label="Launch Kit integration flow">
          <article><span>01 · SDK</span><strong>Validate locally</strong><p>Typed ESM/CommonJS package, versioned schemas and consistent issue paths.</p></article>
          <article><span>02 · API</span><strong>Validate remotely</strong><p>POST a bundle to /api/v1/partner/validate with a strict 256 KiB request limit.</p></article>
          <article><span>03 · HANDOFF</span><strong>Map the draft</strong><p>Target any launchpad by ID, add namespaced extension fields and keep final submission launchpad-owned.</p></article>
        </div>

        <div className="partner-showcase">
          <div>
            <span>PARTNERSHIP SHOWCASE</span>
            <h3>The integration surface is ready for dev review.</h3>
            <p>
              The core format is partner-neutral: launchpads receive the same validated
              token, creative, utility and readiness fields, then map optional extensions
              into their own flow. Emblem remains the preferred design-partner target for
              the Solana-first handoff.
            </p>
          </div>
          <div className="partner-showcase-actions">
            <button className="button button-dark" onClick={copyPartnerIntro}>
              Copy partner intro <span>↗</span>
            </button>
            <a href="mailto:devs@zeitmint.com?subject=ZeitMint%20design%20partnership">devs@zeitmint.com</a>
            {partnerMessage ? <p aria-live="polite">{partnerMessage}</p> : null}
          </div>
        </div>
        <p className="sdk-disclaimer">
          SDK source, tests, API contracts and the npm package are ready for partner
          testing. Integration support does not imply a completed partnership or
          endorsement. Partners retain final launch control.
        </p>
      </section>

      <section className="how section-shell" id="how">
        <div className="section-heading light-heading">
          <div>
            <span className="section-index">05 / HOW IT WORKS</span>
            <h2>From project intake to proof-backed launch kit.</h2>
          </div>
          <p>Prepare for Emblem first, attach useful community work, then carry the same manifests across chains.</p>
        </div>
        <div className="steps-grid">
          <article>
            <span>01</span>
            <div className="step-icon">⌁</div>
            <h3>Run the preflight</h3>
            <p>
              Check the project’s metadata, narrative, links and declarations,
              then resolve the blockers before approaching a launchpad.
            </p>
          </article>
          <article>
            <span>02</span>
            <div className="step-icon">✦</div>
            <h3>Build the distinction</h3>
            <p>
              Compare three curated directions, then develop original naming,
              artwork, lore and a focused campaign angle.
            </p>
          </article>
          <article>
            <span>03</span>
            <div className="step-icon">◎</div>
            <h3>Activate utility</h3>
            <p>
              Define useful community work, publish a portable Utility Manifest
              and keep every claim unverified until contributors complete it.
            </p>
          </article>
          <article>
            <span>04</span>
            <div className="step-icon">↗</div>
            <h3>Prepare for Emblem</h3>
            <p>
              Start with an Emblem-ready brief, select Solana or an EVM chain,
              and keep a universal export if another route fits better.
            </p>
          </article>
        </div>
      </section>

      <section className="principles section-shell">
        <div className="principle-copy">
          <span className="section-index">THE ZEITMINT STANDARD</span>
          <h2>Memes move fast. Trust should last.</h2>
          <p>
            ZeitMint is launch-readiness and community-utility software—not a
            token launchpad or a promise of profit. Every claim stays reviewable
            and creator controlled.
          </p>
        </div>
        <div className="principle-list">
          <div><span>01</span><strong>Original by default</strong><p>No copied logos, cloned projects or confusing impersonation.</p></div>
          <div><span>02</span><strong>Differentiation over volume</strong><p>Fewer, stronger directions with a clear audience, story and identity.</p></div>
          <div><span>03</span><strong>No fake promises</strong><p>No guaranteed returns, manufactured volume or hidden promotion.</p></div>
          <div><span>04</span><strong>Emblem-first, multichain</strong><p>Emblem is the preferred launch workflow. Solana is the default chain, with portable EVM options when creators need them.</p></div>
          <div><span>05</span><strong>Utility must be provable</strong><p>A declared mission stays unverified until useful work is completed and a public receipt exists.</p></div>
        </div>
      </section>

      <section className="pricing section-shell" id="pricing">
        <div className="pricing-copy">
          <span className="section-index">FOUNDING RELEASE</span>
          <h2>One moment.<br />One differentiated launch kit.</h2>
          <p>
            The readiness validator is free. When a project needs a complete
            creative package, pay once and keep everything ZeitMint creates.
          </p>
        </div>
        <div className="price-card">
          <div className="price-card-top">
            <span>CREATIVE LAUNCH KIT</span>
            <span>FOUNDING PRICE</span>
          </div>
          <strong className="price">49 <small>USDC</small></strong>
          <span className="price-note">crypto only · network fees separate</span>
          <ul>
            <li>3 curated creative directions</li>
            <li>Cultural timing and audience angle</li>
            <li>Original identity, artwork and lore</li>
            <li>Similarity and safety review</li>
            <li>Campaign starter and handoff notes</li>
            <li>Emblem-ready brief and Launch Kit v1 JSON</li>
            <li>Utility Manifest v1 and community mission builder</li>
            <li>Solana, Robinhood Chain or EVM preference</li>
          </ul>
          <a className="button button-primary" href="#studio">
            Build my Emblem-ready kit <span>↗</span>
          </a>
        </div>
      </section>

      <section className="waitlist" id="waitlist">
        <div>
          <span className="section-index">EARLY ACCESS</span>
          <h2>Make the moment worth noticing.</h2>
        </div>
        <form onSubmit={submitWaitlist} noValidate>
          <label className="sr-only" htmlFor="email">Email address</label>
          <input id="email" name="email" type="email" placeholder="you@theinternet.xyz" />
          <input className="honeypot" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <button className="button button-dark" type="submit" disabled={waitlistPending}>
            {waitlistPending ? "Joining…" : "Join the founding list ↗"}
          </button>
          {waitlistMessage ? <p aria-live="polite">{waitlistMessage}</p> : null}
          <small>
            Anonymous visit alerts are sent once per browser session. IP addresses
            are not included in those alerts.
          </small>
        </form>
      </section>

      <footer>
        <a className="brand" href="#top">
          <BrandMark />
          <span>ZeitMint</span>
        </a>
        <p>Emblem first. Multichain by design.</p>
        <div>
          <a href="#studio">Studio</a>
          <a href="#validator">Validator</a>
          <a href="#utility">Utility</a>
          <a href="#sdk">SDK</a>
          <a href="#how">Principles</a>
          <a href="mailto:devs@zeitmint.com">Partner</a>
        </div>
        <span>© 2026 ZeitMint · Independent project</span>
      </footer>
    </main>
  );
}
