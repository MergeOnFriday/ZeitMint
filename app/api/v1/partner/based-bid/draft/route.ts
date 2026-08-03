import {
  createBasedBidDraft,
  validateBasedBidDraftOptions,
  validateBundle,
} from "@zeitmint/launch-kit";
import {
  authorizePartnerRequest,
  partnerJson,
  partnerOptions,
  readPartnerJson,
} from "@/app/lib/partner-api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  const authorization = authorizePartnerRequest(request, "based-bid");
  if (!authorization.ok) {
    return partnerJson(
      {
        ok: false,
        error: { code: authorization.code, message: authorization.message },
      },
      authorization.status,
    );
  }

  const body = await readPartnerJson(request);
  if (!body.ok) {
    return partnerJson(
      { ok: false, error: { code: body.code, message: body.message } },
      body.status,
    );
  }

  if (!isRecord(body.value) || !("bundle" in body.value)) {
    return partnerJson(
      { ok: false, error: { code: "required", message: "A bundle object is required." } },
      422,
    );
  }

  const [bundle, options] = [
    validateBundle(body.value.bundle),
    validateBasedBidDraftOptions(body.value.options),
  ];
  const issues = [
    ...(bundle.valid ? [] : bundle.issues),
    ...(options.valid ? [] : options.issues),
  ];
  if (!bundle.valid || !options.valid) {
    return partnerJson({ ok: false, issues }, 422);
  }

  return partnerJson({
    ok: true,
    draft: createBasedBidDraft(bundle.value, options.value),
  });
}

export function OPTIONS() {
  return partnerOptions();
}
