"use client";

import { FormEvent, useState } from "react";
import {
  buildUtilityManifest,
  validateUtilityMission,
  type UtilityMissionInput,
  type UtilityMissionIssue,
  type ZeitMintUtilityManifest,
} from "./lib/utility-manifest";

const utilityDraftStorageKey = "zeitmint:utility-draft:v1";

const emptyDraft: UtilityMissionInput = {
  projectName: "",
  symbol: "",
  chain: "solana",
  preferredLaunchpad: "emblem",
  title: "",
  deliverable: "",
  submissionRequirements: "",
  rewardAmount: "",
  rewardAsset: "USDC",
  bonusAmount: "",
  bonusAsset: "",
  deadline: "",
  fundingSource: "community-treasury",
  fundingStatus: "planned",
  approval: "creator-review",
  originalWorkRequired: false,
  engagementFarmingProhibited: false,
};

const utilityModules = [
  { name: "Community missions", note: "Build contributors", status: "AVAILABLE" },
  { name: "Token-gated access", note: "Unlock perks", status: "NEXT" },
  { name: "Burn-to-redeem", note: "Consume for value", status: "PLANNED" },
  { name: "Community signalling", note: "Guide decisions", status: "PLANNED" },
];

const exampleMissions = [
  { number: "001", title: "Community trailer", reward: "250 USDC + 100K AIDOGE", type: "CREATIVE" },
  { number: "002", title: "Telegram utility bot", reward: "400 USDC", type: "DEVELOPMENT" },
  { number: "003", title: "Spanish launch kit", reward: "75 USDC", type: "LOCALIZATION" },
];

function futureDate(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function chainLabel(chain: UtilityMissionInput["chain"]) {
  if (chain === "solana") return "Solana";
  if (chain === "robinhood-chain") return "Robinhood Chain";
  return "Other EVM";
}

function fundingLabel(source: UtilityMissionInput["fundingSource"]) {
  if (source === "creator-funded") return "Creator funded";
  if (source === "programmable-fees") return "Programmable fees";
  return "Community treasury";
}

export default function UtilityBuilder() {
  const [draft, setDraft] = useState<UtilityMissionInput>(emptyDraft);
  const [manifest, setManifest] = useState<ZeitMintUtilityManifest>();
  const [issues, setIssues] = useState<UtilityMissionIssue[]>([]);
  const [message, setMessage] = useState("");

  function saveLocalDraft(nextDraft: UtilityMissionInput) {
    try {
      window.localStorage.setItem(
        utilityDraftStorageKey,
        JSON.stringify({ version: 1, draft: nextDraft }),
      );
    } catch {
      // Local drafts are a convenience; the builder still works when storage is unavailable.
    }
  }

  function updateDraft<Key extends keyof UtilityMissionInput>(
    key: Key,
    value: UtilityMissionInput[Key],
  ) {
    const nextDraft = { ...draft, [key]: value };
    setDraft(nextDraft);
    saveLocalDraft(nextDraft);
    setManifest(undefined);
    setIssues([]);
    setMessage("");
  }

  function loadExample() {
    const example: UtilityMissionInput = {
      projectName: "Artificial Doge",
      symbol: "AIDOGE",
      chain: "solana",
      preferredLaunchpad: "emblem",
      title: "Create our first community trailer",
      deliverable:
        "Produce an original 30–60 second video that introduces the Artificial Doge story and gives the community a reusable launch asset.",
      submissionRequirements:
        "Submit an MP4 file, editable source files and confirmation that every visual and audio element is original or properly licensed.",
      rewardAmount: "250",
      rewardAsset: "USDC",
      bonusAmount: "100000",
      bonusAsset: "AIDOGE",
      deadline: futureDate(30),
      fundingSource: "community-treasury",
      fundingStatus: "planned",
      approval: "hybrid",
      originalWorkRequired: true,
      engagementFarmingProhibited: true,
    };
    setDraft(example);
    saveLocalDraft(example);
    setManifest(buildUtilityManifest(example));
    setIssues([]);
    setMessage("Example mission loaded. Edit it into your own utility.");
  }

  function restoreDraft() {
    try {
      const stored = window.localStorage.getItem(utilityDraftStorageKey);
      if (!stored) {
        setMessage("No local utility draft found in this browser.");
        return;
      }
      const parsed = JSON.parse(stored) as {
        version?: number;
        draft?: Partial<UtilityMissionInput>;
      };
      if (parsed.version !== 1 || !parsed.draft) {
        throw new Error("Unsupported draft");
      }
      setDraft({ ...emptyDraft, ...parsed.draft });
      setManifest(undefined);
      setIssues([]);
      setMessage("Local utility draft restored.");
    } catch {
      window.localStorage.removeItem(utilityDraftStorageKey);
      setMessage("The saved draft could not be restored and was cleared.");
    }
  }

  function generateManifest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextIssues = validateUtilityMission(draft);
    setIssues(nextIssues);

    if (nextIssues.length) {
      setManifest(undefined);
      setMessage(`${nextIssues.length} item${nextIssues.length === 1 ? "" : "s"} need attention.`);
      return;
    }

    saveLocalDraft(draft);
    setManifest(buildUtilityManifest(draft));
    setMessage("Utility Manifest v1 generated. The mission remains a local draft until hosted publishing is enabled.");
  }

  function downloadManifest() {
    if (!manifest) return;
    const file = new Blob([`${JSON.stringify(manifest, null, 2)}\n`], {
      type: "application/json",
    });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `zeitmint-${manifest.project.symbol.toLowerCase()}-utility-manifest.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage("Utility Manifest downloaded.");
  }

  async function copyAnnouncement() {
    if (!manifest) return;
    const bonus = manifest.mission.reward.bonus
      ? ` + ${manifest.mission.reward.bonus.amount} ${manifest.mission.reward.bonus.asset}`
      : "";
    const announcement = [
      `${manifest.project.name} community mission`,
      "",
      manifest.mission.title,
      manifest.mission.deliverable,
      "",
      `Reward: ${manifest.mission.reward.primary.amount} ${manifest.mission.reward.primary.asset}${bonus}`,
      `Deadline: ${manifest.mission.deadline}`,
      `Chain: ${chainLabel(manifest.project.chain)}`,
      "",
      "Original work only. No engagement farming.",
      "Utility designed with ZeitMint.",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(announcement);
      setMessage("Community mission announcement copied.");
    } catch {
      setMessage("Clipboard access was blocked. Download the manifest instead.");
    }
  }

  const rewardLabel = draft.rewardAmount
    ? `${draft.rewardAmount} ${draft.rewardAsset || "ASSET"}`
    : "Reward not set";
  const bonusLabel =
    draft.bonusAmount && draft.bonusAsset
      ? ` + ${draft.bonusAmount} ${draft.bonusAsset}`
      : "";

  return (
    <section className="utility section-shell" id="utility">
      <div className="utility-heading">
        <div>
          <span className="section-index">03 / UTILITY LAYER</span>
          <h2>Don’t just launch a token.<br /><span>Give people something to do.</span></h2>
        </div>
        <div>
          <p>
            Turn holders into contributors with useful, scoped community work.
            ZeitMint defines the mission, blocks engagement farming and exports
            a portable Utility Manifest for projects and launchpads.
          </p>
          <div className="utility-principle">
            <span>LAUNCH KIT</span><strong>What the project is</strong>
            <i>+</i>
            <span>UTILITY MANIFEST</span><strong>What the token does</strong>
          </div>
        </div>
      </div>

      <div className="utility-modules" aria-label="ZeitMint utility modules">
        {utilityModules.map((module) => (
          <article className={module.status === "AVAILABLE" ? "active" : ""} key={module.name}>
            <span>{module.status}</span>
            <strong>{module.name}</strong>
            <small>{module.note}</small>
          </article>
        ))}
      </div>

      <div className="mission-builder-shell">
        <form className="mission-builder-form" onSubmit={generateManifest}>
          <div className="mission-builder-top">
            <div className="mission-builder-label"><span>UTILITY BUILDER</span><strong>Community mission</strong></div>
            <div className="mission-builder-tools">
              <button type="button" onClick={restoreDraft}>Restore draft</button>
              <button type="button" onClick={loadExample}>Load example ↗</button>
            </div>
          </div>

          <fieldset>
            <legend>Project</legend>
            <div className="mission-form-grid two-columns">
              <label>PROJECT NAME<input value={draft.projectName} onChange={(event) => updateDraft("projectName", event.target.value)} placeholder="Artificial Doge" maxLength={80} /></label>
              <label>TICKER<input value={draft.symbol} onChange={(event) => updateDraft("symbol", event.target.value.toUpperCase())} placeholder="AIDOGE" maxLength={10} /></label>
              <label>CHAIN<select value={draft.chain} onChange={(event) => updateDraft("chain", event.target.value as UtilityMissionInput["chain"])}><option value="solana">Solana · default</option><option value="robinhood-chain">Robinhood Chain</option><option value="evm">Other EVM</option></select></label>
              <label>LAUNCHPAD HANDOFF<select value={draft.preferredLaunchpad} onChange={(event) => updateDraft("preferredLaunchpad", event.target.value as UtilityMissionInput["preferredLaunchpad"])}><option value="emblem">Emblem · primary target</option><option value="open-standard">Open standard</option></select></label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Useful work</legend>
            <label>MISSION TITLE<input value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} placeholder="Create our first community trailer" maxLength={100} /></label>
            <label>DELIVERABLE<textarea value={draft.deliverable} onChange={(event) => updateDraft("deliverable", event.target.value)} placeholder="Describe the useful work and the finished asset the community needs." rows={4} maxLength={700} /><small>{draft.deliverable.trim().length}/40 minimum characters</small></label>
            <label>VALID SUBMISSION MUST INCLUDE<textarea value={draft.submissionRequirements} onChange={(event) => updateDraft("submissionRequirements", event.target.value)} placeholder="File format, source files, licensing confirmation and any review criteria." rows={3} maxLength={500} /></label>
          </fieldset>

          <fieldset>
            <legend>Reward and review</legend>
            <div className="mission-form-grid reward-grid">
              <label>PRIMARY AMOUNT<input inputMode="decimal" value={draft.rewardAmount} onChange={(event) => updateDraft("rewardAmount", event.target.value)} placeholder="250" /></label>
              <label>ASSET<input value={draft.rewardAsset} onChange={(event) => updateDraft("rewardAsset", event.target.value.toUpperCase())} placeholder="USDC" maxLength={12} /></label>
              <label>BONUS AMOUNT<input inputMode="decimal" value={draft.bonusAmount} onChange={(event) => updateDraft("bonusAmount", event.target.value)} placeholder="Optional" /></label>
              <label>BONUS ASSET<input value={draft.bonusAsset} onChange={(event) => updateDraft("bonusAsset", event.target.value.toUpperCase())} placeholder="AIDOGE" maxLength={12} /></label>
            </div>
            <div className="mission-form-grid two-columns">
              <label>DEADLINE<input type="date" value={draft.deadline} onChange={(event) => updateDraft("deadline", event.target.value)} /></label>
              <label>APPROVAL<select value={draft.approval} onChange={(event) => updateDraft("approval", event.target.value as UtilityMissionInput["approval"])}><option value="creator-review">Creator review</option><option value="community-vote">Community vote</option><option value="hybrid">Creator + community</option></select></label>
              <label>FUNDING SOURCE<select value={draft.fundingSource} onChange={(event) => updateDraft("fundingSource", event.target.value as UtilityMissionInput["fundingSource"])}><option value="community-treasury">Community treasury</option><option value="creator-funded">Creator funded</option><option value="programmable-fees">Programmable fees</option></select></label>
              <label>FUNDING STATUS<select value={draft.fundingStatus} onChange={(event) => updateDraft("fundingStatus", event.target.value as UtilityMissionInput["fundingStatus"])}><option value="planned">Planned · not verified</option><option value="self-declared-funded">Self-declared funded</option></select></label>
            </div>
          </fieldset>

          <fieldset className="mission-integrity">
            <legend>Mission integrity</legend>
            <label><input type="checkbox" checked={draft.originalWorkRequired} onChange={(event) => updateDraft("originalWorkRequired", event.target.checked)} /><span><strong>Original work is required.</strong><small>Submissions must be original or properly licensed.</small></span></label>
            <label><input type="checkbox" checked={draft.engagementFarmingProhibited} onChange={(event) => updateDraft("engagementFarmingProhibited", event.target.checked)} /><span><strong>No engagement farming.</strong><small>No rewards for buying, shilling, raids, likes or reposts.</small></span></label>
          </fieldset>

          {issues.length ? (
            <div className="mission-issues" role="alert">
              <strong>Fix before generating</strong>
              <ul>{issues.map((issue) => <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>)}</ul>
            </div>
          ) : null}

          <button className="button button-primary mission-generate" type="submit">Generate Utility Manifest <span>↗</span></button>
          <small className="mission-local-note">Drafts are versioned and saved only in this browser. ZeitMint does not hold reward funds.</small>
          <a className="mission-schema-link" href="/utility-manifest.schema.json" target="_blank" rel="noreferrer">Open Utility Manifest v1 schema ↗</a>
        </form>

        <div className={manifest ? "mission-preview has-manifest" : "mission-preview"} aria-live="polite">
          <div className="mission-preview-top"><span>PUBLIC MISSION PREVIEW</span><strong>{manifest ? "MANIFEST READY" : "LOCAL DRAFT"}</strong></div>
          <div className="mission-preview-project">
            <div>{(draft.symbol || "ZM").slice(0, 3)}</div>
            <span><small>{draft.projectName || "UNTITLED PROJECT"}</small><strong>{chainLabel(draft.chain)}</strong></span>
          </div>
          <span className="mission-preview-index">MISSION 001 · COMMUNITY BOUNTY</span>
          <h3>{draft.title || "Give this mission a clear title."}</h3>
          <p>{draft.deliverable || "Describe useful work that leaves the project with a concrete, reviewable deliverable."}</p>
          <dl className="mission-preview-stats">
            <div><dt>REWARD</dt><dd>{rewardLabel}{bonusLabel}</dd></div>
            <div><dt>DEADLINE</dt><dd>{draft.deadline || "Not set"}</dd></div>
            <div><dt>FUNDING</dt><dd>{fundingLabel(draft.fundingSource)}</dd></div>
            <div><dt>APPROVAL</dt><dd>{draft.approval.replaceAll("-", " ")}</dd></div>
          </dl>
          <div className="mission-preview-proof">
            <span className={draft.originalWorkRequired ? "ready" : ""}>✓ Original work</span>
            <span className={draft.engagementFarmingProhibited ? "ready" : ""}>✓ No engagement farming</span>
            <span>○ Completion proof pending</span>
          </div>
          {manifest ? (
            <div className="mission-preview-actions">
              <button className="button button-dark" onClick={downloadManifest}>Download manifest <span>↓</span></button>
              <button className="button button-ghost" onClick={copyAnnouncement}>Copy announcement <span>↗</span></button>
            </div>
          ) : null}
          {message ? <p className="mission-message">{message}</p> : null}
          <small className="mission-preview-disclaimer">Preview only. Funding is self-declared and completion remains unverified until a public receipt is created.</small>
        </div>
      </div>

      <div className="mission-examples-heading">
        <div><span>WHAT THIS UNLOCKS</span><h3>One community. Useful work every week.</h3></div>
        <p>Examples only—not active opportunities. Hosted missions, submissions and completion receipts are the next release.</p>
      </div>
      <div className="mission-examples">
        {exampleMissions.map((mission) => (
          <article key={mission.number}>
            <div><span>EXAMPLE / {mission.number}</span><strong>{mission.type}</strong></div>
            <h4>{mission.title}</h4>
            <p>{mission.reward}</p>
            <span>Original contribution → public proof</span>
          </article>
        ))}
      </div>
    </section>
  );
}
