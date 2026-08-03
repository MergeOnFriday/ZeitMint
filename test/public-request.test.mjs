import assert from "node:assert/strict";
import test from "node:test";
import {
  isSameOriginRequest,
  oneLine,
  readLimitedJson,
} from "../app/lib/public-request.ts";

function jsonRequest(body, headers = {}) {
  return new Request("https://www.zeitmint.com/api/waitlist", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "www.zeitmint.com",
      origin: "https://www.zeitmint.com",
      ...headers,
    },
    body,
  });
}

test("accepts only matching browser origins", () => {
  assert.equal(isSameOriginRequest(jsonRequest("{}")), true);
  assert.equal(
    isSameOriginRequest(jsonRequest("{}", { origin: "https://attacker.example" })),
    false,
  );
  assert.equal(
    isSameOriginRequest(jsonRequest("{}", { origin: "" })),
    false,
  );
});

test("reads valid JSON within the public form limit", async () => {
  const result = await readLimitedJson(jsonRequest('{"email":"test@example.com"}'));
  assert.equal(result.ok, true);
  assert.equal(result.value.email, "test@example.com");
});

test("rejects unsupported media types and oversized streamed bodies", async () => {
  const wrongType = await readLimitedJson(jsonRequest("{}", { "content-type": "text/plain" }));
  assert.equal(wrongType.ok, false);
  assert.equal(wrongType.status, 415);

  const oversized = await readLimitedJson(jsonRequest(`"${"x".repeat(4_096)}"`));
  assert.equal(oversized.ok, false);
  assert.equal(oversized.status, 413);
});

test("normalizes untrusted notification text to one line", () => {
  assert.equal(oneLine("  hello\nworld\u0000  ", "fallback", 40), "hello world");
  assert.equal(oneLine(null, "fallback", 40), "fallback");
});
