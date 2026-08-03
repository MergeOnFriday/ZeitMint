import { partnerCapabilities, partnerJson, partnerOptions } from "@/app/lib/partner-api";

export function GET() {
  return partnerJson(
    { ok: true, capabilities: partnerCapabilities },
    200,
    "public, max-age=300, stale-while-revalidate=3600",
  );
}

export function OPTIONS() {
  return partnerOptions();
}
