import { validateBundle } from "@zeitmint/launch-kit";
import { partnerJson, partnerOptions, readPartnerJson } from "@/app/lib/partner-api";

export async function POST(request: Request) {
  const body = await readPartnerJson(request);
  if (!body.ok) {
    return partnerJson(
      { ok: false, error: { code: body.code, message: body.message } },
      body.status,
    );
  }

  const result = validateBundle(body.value);
  if (!result.valid) {
    return partnerJson({ ok: false, issues: result.issues }, 422);
  }

  return partnerJson({ ok: true, bundle: result.value });
}

export function OPTIONS() {
  return partnerOptions();
}
