export type ReadinessChain = "solana" | "robinhood-chain" | "evm";
export type ReadinessLaunchpad = "emblem" | "open-standard";
export const READINESS_REPORT_SCHEMA_URL =
  "https://zeitmint.com/readiness-report.schema.json";

export type ReadinessProject = {
  name: string;
  symbol: string;
  description: string;
  website: string;
  xUrl: string;
  telegramUrl: string;
  artworkUrl: string;
  chain: ReadinessChain;
  launchpad: ReadinessLaunchpad;
  originalIdentityConfirmed: boolean;
  noReturnsPromised: boolean;
  creatorControlsProject: boolean;
};

export type ReadinessCheck = {
  id: string;
  category: "identity" | "narrative" | "presence" | "safety";
  label: string;
  guidance: string;
  passed: boolean;
  severity: "blocker" | "warning";
  weight: number;
};

export type ReadinessReport = {
  $schema: typeof READINESS_REPORT_SCHEMA_URL;
  schemaVersion: "1.0";
  generatedAt: string;
  project: ReadinessProject;
  score: number;
  status: "launch-ready" | "nearly-ready" | "needs-work";
  checks: ReadinessCheck[];
  summary: {
    passed: number;
    total: number;
    blockers: number;
    warnings: number;
  };
  limitations: string[];
};

function isHttpsUrl(value: string, allowedHosts?: string[]) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return false;
    if (!allowedHosts) return Boolean(url.hostname);
    return allowedHosts.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

export function createReadinessReport(
  project: ReadinessProject,
  generatedAt = new Date().toISOString(),
): ReadinessReport {
  const name = project.name.trim();
  const symbol = project.symbol.trim().toUpperCase();
  const description = project.description.trim();

  const checks: ReadinessCheck[] = [
    {
      id: "token-name",
      category: "identity",
      label: "Usable token name",
      guidance: "Use a clear token name between 2 and 40 characters.",
      passed: name.length >= 2 && name.length <= 40,
      severity: "blocker",
      weight: 10,
    },
    {
      id: "token-symbol",
      category: "identity",
      label: "Valid ticker format",
      guidance: "Use 2–10 uppercase letters or numbers without spaces or a $ prefix.",
      passed: /^[A-Z0-9]{2,10}$/.test(symbol),
      severity: "blocker",
      weight: 10,
    },
    {
      id: "project-description",
      category: "narrative",
      label: "Launch-ready description",
      guidance: "Explain the project, audience and cultural hook in at least 80 characters.",
      passed: description.length >= 80 && description.length <= 500,
      severity: "blocker",
      weight: 15,
    },
    {
      id: "website",
      category: "presence",
      label: "Secure project website",
      guidance: "Add a public HTTPS website controlled by the project.",
      passed: isHttpsUrl(project.website),
      severity: "blocker",
      weight: 10,
    },
    {
      id: "x-profile",
      category: "presence",
      label: "Public X profile",
      guidance: "Add the project’s full x.com profile URL.",
      passed: isHttpsUrl(project.xUrl, ["x.com", "twitter.com"]),
      severity: "warning",
      weight: 5,
    },
    {
      id: "telegram",
      category: "presence",
      label: "Community Telegram",
      guidance: "Add the project’s public t.me community URL.",
      passed: isHttpsUrl(project.telegramUrl, ["t.me"]),
      severity: "warning",
      weight: 5,
    },
    {
      id: "artwork",
      category: "identity",
      label: "Hosted artwork asset",
      guidance: "Provide a stable HTTPS URL for the token logo or primary artwork.",
      passed: isHttpsUrl(project.artworkUrl),
      severity: "blocker",
      weight: 10,
    },
    {
      id: "original-identity",
      category: "safety",
      label: "Original identity confirmed",
      guidance: "Confirm the project does not impersonate or reuse another project’s branding.",
      passed: project.originalIdentityConfirmed,
      severity: "blocker",
      weight: 10,
    },
    {
      id: "no-return-promises",
      category: "safety",
      label: "No guaranteed-return claims",
      guidance: "Remove promises of profit, guaranteed returns or manufactured performance.",
      passed: project.noReturnsPromised,
      severity: "blocker",
      weight: 15,
    },
    {
      id: "creator-control",
      category: "safety",
      label: "Creator authority confirmed",
      guidance: "Confirm the submitter controls the project and is authorized to launch it.",
      passed: project.creatorControlsProject,
      severity: "blocker",
      weight: 10,
    },
  ];

  const score = checks.reduce(
    (total, check) => total + (check.passed ? check.weight : 0),
    0,
  );
  const blockers = checks.filter(
    (check) => !check.passed && check.severity === "blocker",
  ).length;
  const warnings = checks.filter(
    (check) => !check.passed && check.severity === "warning",
  ).length;
  const status =
    blockers === 0 && score >= 90
      ? "launch-ready"
      : score >= 70
        ? "nearly-ready"
        : "needs-work";

  return {
    $schema: READINESS_REPORT_SCHEMA_URL,
    schemaVersion: "1.0",
    generatedAt,
    project: {
      ...project,
      name,
      symbol,
      description,
      website: project.website.trim(),
      xUrl: project.xUrl.trim(),
      telegramUrl: project.telegramUrl.trim(),
      artworkUrl: project.artworkUrl.trim(),
    },
    score,
    status,
    checks,
    summary: {
      passed: checks.filter((check) => check.passed).length,
      total: checks.length,
      blockers,
      warnings,
    },
    limitations: [
      "This report validates submitted structure and declarations; it does not verify ownership.",
      "URLs are checked for format only, not availability or page contents.",
      "Name, ticker, trademark, contract and regulatory checks require separate review.",
    ],
  };
}
