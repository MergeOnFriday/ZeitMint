import "server-only";

import { timingSafeEqual } from "node:crypto";

export const PARTNER_API_VERSION = "1.0";
export const SDK_VERSION = "0.3.0";
export const MAX_PARTNER_BODY_BYTES = 256 * 1024;

const commonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Security-Policy": "default-src 'none'",
  "X-Content-Type-Options": "nosniff",
};

export const partnerCapabilities = {
  name: "ZeitMint Partner API",
  apiVersion: PARTNER_API_VERSION,
  sdk: {
    package: "@zeitmint/launch-kit",
    version: SDK_VERSION,
    status: "partner-testing",
    repository: "https://github.com/MergeOnFriday/zeitmint/tree/main/packages/launch-kit",
  },
  specifications: {
    partnerApi: "https://zeitmint.com/partner-api.json",
    launchKit: "https://zeitmint.com/launch-kit.schema.json",
    utilityManifest: "https://zeitmint.com/utility-manifest.schema.json",
    readinessReport: "https://zeitmint.com/readiness-report.schema.json",
  },
  integrations: [
    {
      id: "uniswap-v4",
      packageExport: "@zeitmint/launch-kit/integrations/uniswap-v4",
      status: "ready-for-partner-testing",
      mode: "intent-only",
      executesOnchain: false,
    },
  ],
  endpoints: {
    capabilities: { method: "GET", path: "/api/v1/partner/capabilities" },
    validate: { method: "POST", path: "/api/v1/partner/validate" },
    launchpadDraft: { method: "POST", path: "/api/v1/partner/{partner}/draft" },
  },
  handoffProfile: {
    id: "zeitmint-launchpad-handoff",
    version: "1.0",
    status: "ready-for-partner-testing",
    target: "any-launchpad",
    authentication: "partner-specific-bearer",
    customFields: "options.extensions",
  },
  boundaries: {
    deploysTokens: false,
    signsTransactions: false,
    movesFunds: false,
    configuresLiquidity: false,
    requiresPartnerApproval: true,
  },
} as const;

type ReadBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; status: number; code: string; message: string };

export async function readPartnerJson(request: Request): Promise<ReadBodyResult> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json") && !contentType.includes("+json")) {
    return { ok: false, status: 415, code: "unsupported_media_type", message: "Use application/json." };
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_PARTNER_BODY_BYTES) {
    return { ok: false, status: 413, code: "payload_too_large", message: "Request body exceeds 256 KiB." };
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_PARTNER_BODY_BYTES) {
    return { ok: false, status: 413, code: "payload_too_large", message: "Request body exceeds 256 KiB." };
  }

  try {
    return { ok: true, value: JSON.parse(body) };
  } catch {
    return { ok: false, status: 400, code: "invalid_json", message: "Request body is not valid JSON." };
  }
}

export function partnerJson(
  payload: Record<string, unknown>,
  status = 200,
  cacheControl = "no-store",
) {
  return Response.json(
    {
      apiVersion: PARTNER_API_VERSION,
      sdkVersion: SDK_VERSION,
      requestId: crypto.randomUUID(),
      ...payload,
    },
    {
      status,
      headers: { ...commonHeaders, "Cache-Control": cacheControl },
    },
  );
}

export function partnerOptions() {
  return new Response(null, { status: 204, headers: commonHeaders });
}

type PartnerAuthorization =
  | { ok: true }
  | { ok: false; status: 401 | 503; code: string; message: string };

function configuredPartnerKey(partner: string) {
  const raw = process.env.ZEITMINT_PARTNER_KEYS;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    const value = (parsed as Record<string, unknown>)[partner];
    return typeof value === "string" && value.length >= 24 ? value : null;
  } catch {
    return null;
  }
}

export function authorizePartnerRequest(
  request: Request,
  partner: string,
): PartnerAuthorization {
  const expected = configuredPartnerKey(partner);
  if (!expected) {
    return {
      ok: false,
      status: 503,
      code: "partner_auth_not_configured",
      message: "Partner authentication is not configured.",
    };
  }

  const authorization = request.headers.get("authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  const matches =
    expectedBytes.length === suppliedBytes.length &&
    timingSafeEqual(expectedBytes, suppliedBytes);

  return matches
    ? { ok: true }
    : {
        ok: false,
        status: 401,
        code: "unauthorized",
        message: "A valid partner bearer token is required.",
      };
}
