import {
  createLaunchpadDraft,
  validateBundle,
  validateLaunchpadDraftOptions,
  validateLaunchpadId,
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ partner: string }> },
) {
  const { partner } = await params;
  const launchpad = validateLaunchpadId(partner);
  if (!launchpad.valid) {
    return partnerJson({ ok: false, issues: launchpad.issues }, 422);
  }

  const authorization = authorizePartnerRequest(request, launchpad.value);
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

  const unknownFields = Object.keys(body.value).filter(
    (key) => key !== "bundle" && key !== "options",
  );
  if (unknownFields.length > 0) {
    return partnerJson(
      {
        ok: false,
        issues: unknownFields.map((key) => ({
          path: `/${key}`,
          code: "additionalProperties",
          message: "Unknown partner draft request field.",
        })),
      },
      422,
    );
  }

  const [bundle, options] = [
    validateBundle(body.value.bundle),
    validateLaunchpadDraftOptions(body.value.options),
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
    draft: createLaunchpadDraft(bundle.value, launchpad.value, options.value),
  });
}

export function OPTIONS() {
  return partnerOptions();
}
