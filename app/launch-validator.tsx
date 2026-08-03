"use client";

import { FormEvent, useState } from "react";
import {
  createReadinessReport,
  type ReadinessProject,
  type ReadinessReport,
} from "./lib/readiness";

const emptyProject: ReadinessProject = {
  name: "",
  symbol: "",
  description: "",
  website: "",
  xUrl: "",
  telegramUrl: "",
  artworkUrl: "",
  chain: "solana",
  launchpad: "emblem",
  originalIdentityConfirmed: false,
  noReturnsPromised: false,
  creatorControlsProject: false,
};

const exampleProject: ReadinessProject = {
  name: "Artificial Doge",
  symbol: "AIDOGE",
  description:
    "An original, creator-led internet culture project exploring the overlap between classic meme language and the current age of autonomous AI agents.",
  website: "https://zeitmint.com",
  xUrl: "https://x.com/zeitmint",
  telegramUrl: "https://t.me/ZeitMint",
  artworkUrl: "https://zeitmint.com/og-emblem-multichain.png",
  chain: "solana",
  launchpad: "emblem",
  originalIdentityConfirmed: true,
  noReturnsPromised: true,
  creatorControlsProject: true,
};

const chainLabels: Record<ReadinessProject["chain"], string> = {
  solana: "Solana",
  "robinhood-chain": "Robinhood Chain",
  evm: "Other EVM",
};

function statusLabel(status: ReadinessReport["status"]) {
  if (status === "launch-ready") return "Launch-ready";
  if (status === "nearly-ready") return "Nearly ready";
  return "Needs work";
}

export default function LaunchValidator() {
  const [project, setProject] = useState<ReadinessProject>(emptyProject);
  const [report, setReport] = useState<ReadinessReport>();
  const [reportMessage, setReportMessage] = useState("");

  function updateProject<Key extends keyof ReadinessProject>(
    key: Key,
    value: ReadinessProject[Key],
  ) {
    setProject((current) => ({ ...current, [key]: value }));
    setReport(undefined);
    setReportMessage("");
  }

  function validateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReport(createReadinessReport(project));
    setReportMessage("");
  }

  function loadExample() {
    setProject(exampleProject);
    setReport(createReadinessReport(exampleProject));
    setReportMessage("Example project loaded.");
  }

  function downloadReport() {
    if (!report) return;
    const file = new Blob([`${JSON.stringify(report, null, 2)}\n`], {
      type: "application/json",
    });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `zeitmint-${report.project.symbol.toLowerCase() || "project"}-readiness.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setReportMessage("Readiness report downloaded.");
  }

  async function copyHandoff() {
    if (!report) return;
    const fixes = report.checks
      .filter((check) => !check.passed)
      .map((check) => `- ${check.label}: ${check.guidance}`);
    const handoff = [
      `${report.project.name || "Untitled project"} ($${report.project.symbol || "TBD"})`,
      `Readiness: ${report.score}/100 · ${statusLabel(report.status)}`,
      `Preferred launchpad: ${report.project.launchpad === "emblem" ? "Emblem" : "Open standard"}`,
      `Preferred chain: ${chainLabels[report.project.chain]}`,
      report.project.description,
      "",
      fixes.length ? "Priority fixes:" : "No structural blockers found.",
      ...fixes,
      "",
      "Generated with ZeitMint Launch Readiness v1",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(handoff);
      setReportMessage("Launchpad handoff copied.");
    } catch {
      setReportMessage("Clipboard access was blocked. Download the JSON report instead.");
    }
  }

  return (
    <section className="validator section-shell" id="validator">
      <div className="section-heading validator-heading">
        <div>
          <span className="section-index">01 / FREE LAUNCH VALIDATOR</span>
          <h2>Know what is missing before a launchpad does.</h2>
        </div>
        <p>
          Check the structure, public presence and creator declarations behind
          a token project. Get a scored report and a clean handoff for Emblem,
          Solana or an EVM launch workflow.
        </p>
      </div>

      <div className="validator-shell">
        <form className="validator-form" onSubmit={validateProject}>
          <div className="validator-form-top">
            <span>PROJECT INTAKE</span>
            <button type="button" onClick={loadExample}>Load example ↗</button>
          </div>

          <fieldset>
            <legend>Identity</legend>
            <div className="validator-row two-columns">
              <label>
                TOKEN NAME
                <input
                  value={project.name}
                  onChange={(event) => updateProject("name", event.target.value)}
                  placeholder="Artificial Doge"
                  maxLength={40}
                />
              </label>
              <label>
                TICKER
                <input
                  value={project.symbol}
                  onChange={(event) => updateProject("symbol", event.target.value.toUpperCase())}
                  placeholder="AIDOGE"
                  maxLength={10}
                />
              </label>
            </div>
            <label>
              PROJECT DESCRIPTION
              <textarea
                value={project.description}
                onChange={(event) => updateProject("description", event.target.value)}
                placeholder="What is the project, who is it for, and why does it belong in culture now?"
                maxLength={500}
                rows={5}
              />
              <small>{project.description.trim().length}/80 minimum characters</small>
            </label>
          </fieldset>

          <fieldset>
            <legend>Launch route</legend>
            <div className="validator-row two-columns">
              <label>
                PREFERRED LAUNCHPAD
                <select
                  value={project.launchpad}
                  onChange={(event) => updateProject("launchpad", event.target.value as ReadinessProject["launchpad"])}
                >
                  <option value="emblem">Emblem · primary target</option>
                  <option value="open-standard">Open launchpad format</option>
                </select>
              </label>
              <label>
                PREFERRED CHAIN
                <select
                  value={project.chain}
                  onChange={(event) => updateProject("chain", event.target.value as ReadinessProject["chain"])}
                >
                  <option value="solana">Solana · default</option>
                  <option value="robinhood-chain">Robinhood Chain</option>
                  <option value="evm">Other EVM</option>
                </select>
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Public presence</legend>
            <div className="validator-row two-columns">
              <label>WEBSITE<input type="url" value={project.website} onChange={(event) => updateProject("website", event.target.value)} placeholder="https://project.xyz" /></label>
              <label>ARTWORK URL<input type="url" value={project.artworkUrl} onChange={(event) => updateProject("artworkUrl", event.target.value)} placeholder="https://project.xyz/logo.png" /></label>
              <label>X PROFILE<input type="url" value={project.xUrl} onChange={(event) => updateProject("xUrl", event.target.value)} placeholder="https://x.com/project" /></label>
              <label>TELEGRAM<input type="url" value={project.telegramUrl} onChange={(event) => updateProject("telegramUrl", event.target.value)} placeholder="https://t.me/project" /></label>
            </div>
          </fieldset>

          <fieldset className="declarations">
            <legend>Creator declarations</legend>
            <label><input type="checkbox" checked={project.originalIdentityConfirmed} onChange={(event) => updateProject("originalIdentityConfirmed", event.target.checked)} /><span><strong>The identity is original.</strong><small>It does not impersonate or reuse another project’s branding.</small></span></label>
            <label><input type="checkbox" checked={project.noReturnsPromised} onChange={(event) => updateProject("noReturnsPromised", event.target.checked)} /><span><strong>No returns are promised.</strong><small>Marketing avoids guarantees of profit or manufactured performance.</small></span></label>
            <label><input type="checkbox" checked={project.creatorControlsProject} onChange={(event) => updateProject("creatorControlsProject", event.target.checked)} /><span><strong>I control this project.</strong><small>The submitter is authorized to prepare it for launch.</small></span></label>
          </fieldset>

          <button className="button button-primary validator-submit" type="submit">
            Run launch-readiness check <span>↗</span>
          </button>
          <small className="validator-privacy">Runs in your browser. Nothing is submitted or stored.</small>
        </form>

        <div className={report ? "validator-report has-report" : "validator-report"} aria-live="polite">
          {report ? (
            <>
              <div className="score-header">
                <div>
                  <span>READINESS SCORE</span>
                  <strong>{statusLabel(report.status)}</strong>
                </div>
                <div className="score-number"><strong>{report.score}</strong><span>/100</span></div>
              </div>
              <div className="score-track" aria-label={`Launch readiness score ${report.score} out of 100`}><span style={{ width: `${report.score}%` }} /></div>
              <div className="report-summary">
                <span><strong>{report.summary.passed}</strong><small>Checks passed</small></span>
                <span><strong>{report.summary.blockers}</strong><small>Blockers</small></span>
                <span><strong>{report.summary.warnings}</strong><small>Warnings</small></span>
              </div>
              <div className="report-checks">
                {report.checks.map((check) => (
                  <div className={check.passed ? "passed" : check.severity} key={check.id}>
                    <span>{check.passed ? "✓" : check.severity === "blocker" ? "!" : "·"}</span>
                    <div><strong>{check.label}</strong><small>{check.passed ? "Ready" : check.guidance}</small></div>
                    <em>{check.weight}</em>
                  </div>
                ))}
              </div>
              <div className="report-actions">
                <button className="button button-dark" onClick={downloadReport}>Download report <span>↓</span></button>
                <button className="button button-ghost" onClick={copyHandoff}>Copy handoff <span>↗</span></button>
              </div>
              {reportMessage ? <p className="report-message">{reportMessage}</p> : null}
              <small className="report-limit">Structural preflight only. Ownership, availability, trademark, contract and regulatory review remain separate.</small>
            </>
          ) : (
            <div className="empty-report">
              <span>FREE STRUCTURAL PREFLIGHT</span>
              <strong>0<span>/100</span></strong>
              <h3>Your launch report will appear here.</h3>
              <p>Complete the intake to see blockers, warnings and the fields already ready for a launchpad handoff.</p>
              <ul><li>10 deterministic checks</li><li>Downloadable JSON report</li><li>Emblem-first, multichain handoff</li></ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
