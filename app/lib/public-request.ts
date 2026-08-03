export const PUBLIC_FORM_MAX_BYTES = 4 * 1024;

type ReadJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413 | 415; message: string };

const responseHeaders = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export function publicJson(payload: Record<string, unknown>, status = 200) {
  return Response.json(payload, { status, headers: responseHeaders });
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = (forwardedHost || request.headers.get("host") || "")
    .split(",", 1)[0]
    .trim()
    .toLowerCase();

  if (!origin || !host) return false;

  try {
    const originUrl = new URL(origin);
    return (
      (originUrl.protocol === "https:" || originUrl.protocol === "http:") &&
      originUrl.host.toLowerCase() === host
    );
  } catch {
    return false;
  }
}

export async function readLimitedJson(
  request: Request,
  maxBytes = PUBLIC_FORM_MAX_BYTES,
): Promise<ReadJsonResult> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json") && !contentType.includes("+json")) {
    return { ok: false, status: 415, message: "Use application/json." };
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { ok: false, status: 413, message: "Request is too large." };
  }

  if (!request.body) {
    return { ok: false, status: 400, message: "Request body is required." };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return { ok: false, status: 413, message: "Request is too large." };
      }
      chunks.push(value);
    }
  } catch {
    await reader.cancel().catch(() => undefined);
    return { ok: false, status: 400, message: "Request body could not be read." };
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400, message: "Invalid JSON request." };
  }
}

export function oneLine(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string") return fallback;
  const normalized = value.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  return normalized.slice(0, maxLength) || fallback;
}
