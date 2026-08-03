import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { buildLaunchKit, validateBundle } from "../dist/index.js";
import {
  UNISWAP_V4_DYNAMIC_FEE,
  UNISWAP_V4_NATIVE_CURRENCY,
  createUniswapV4PoolIntent,
  decodeUniswapV4HookPermissions,
  validateUniswapV4PoolIntentOptions,
} from "../dist/integrations/uniswap-v4.js";

const concept = {
  name: "Artificial Doge",
  ticker: "AIDOGE",
  lane: "AI culture",
  hook: "The dog learned prompting.",
  description: "An original community project with useful contributor missions.",
  palette: "chrome and lime",
};

function validBundle() {
  const result = validateBundle({
    launchKit: buildLaunchKit(concept, { launchpad: "based-bid", chain: "evm" }),
  });
  assert.equal(result.valid, true);
  return result.value;
}

const hookWithBeforeSwap = "0x0000000000000000000000000000000000000080";

test("decodes permissions encoded in the low bits of a v4 hook address", () => {
  assert.deepEqual(decodeUniswapV4HookPermissions(hookWithBeforeSwap), ["beforeSwap"]);
});

test("creates an execution-free, ordered Uniswap v4 PoolKey intent", () => {
  const intent = createUniswapV4PoolIntent(validBundle(), {
    chainId: 8453,
    poolManager: "0x0000000000000000000000000000000000001000",
    tokenAddress: "0x0000000000000000000000000000000000000100",
    quoteCurrency: "native",
    fee: "dynamic",
    tickSpacing: 60,
    hookAddress: hookWithBeforeSwap,
    expectedHookPermissions: ["beforeSwap"],
    initialSqrtPriceX96: "79228162514264337593543950336",
  }, "2026-08-03T12:00:00.000Z");

  assert.equal(intent.poolKey.currency0, UNISWAP_V4_NATIVE_CURRENCY);
  assert.equal(intent.poolKey.currency1, "0x0000000000000000000000000000000000000100");
  assert.equal(intent.poolKey.fee, UNISWAP_V4_DYNAMIC_FEE);
  assert.deepEqual(intent.hook.decodedPermissions, ["beforeSwap"]);
  assert.equal(intent.review.readyForPoolConstruction, true);
  assert.equal(intent.review.initializesPool, false);
  assert.equal(intent.review.signsTransactions, false);
});

test("rejects permission mismatches and invalid fee or hook combinations", () => {
  const mismatch = validateUniswapV4PoolIntentOptions({
    hookAddress: hookWithBeforeSwap,
    expectedHookPermissions: ["afterSwap"],
  });
  assert.equal(mismatch.valid, false);
  assert.ok(mismatch.issues.some((issue) => issue.code === "hookAddressFlags"));

  const zeroDynamicHook = validateUniswapV4PoolIntentOptions({
    fee: "dynamic",
    hookAddress: UNISWAP_V4_NATIVE_CURRENCY,
  });
  assert.equal(zeroDynamicHook.valid, false);

  const excessiveStaticFee = validateUniswapV4PoolIntentOptions({ fee: 1_000_001 });
  assert.equal(excessiveStaticFee.valid, false);
});

test("ships a CommonJS entry point for the optional integration", () => {
  const require = createRequire(import.meta.url);
  const integration = require("../dist/integrations/uniswap-v4.cjs");
  assert.equal(typeof integration.createUniswapV4PoolIntent, "function");
});
