import { createPartnerHandoff, type ZeitMintBundle } from "../bundle.js";
import {
  ZeitMintValidationError,
  type ValidationIssue,
  type ValidationResult,
} from "../validate.js";

export const UNISWAP_V4_DYNAMIC_FEE = 0x800000;
export const UNISWAP_V4_MAX_STATIC_FEE = 1_000_000;
export const UNISWAP_V4_MIN_TICK_SPACING = 1;
export const UNISWAP_V4_MAX_TICK_SPACING = 32_767;
export const UNISWAP_V4_NATIVE_CURRENCY =
  "0x0000000000000000000000000000000000000000";

const ZERO_BIGINT = BigInt(0);
const ONE_BIGINT = BigInt(1);
const MIN_SQRT_PRICE_X96 = BigInt("4295128739");
const MAX_SQRT_PRICE_X96 = BigInt(
  "1461446703485210103287273052203988822378723970342",
);
const addressPattern = /^0x[0-9a-fA-F]{40}$/;

export type UniswapV4HookPermission =
  | "beforeInitialize"
  | "afterInitialize"
  | "beforeAddLiquidity"
  | "afterAddLiquidity"
  | "beforeRemoveLiquidity"
  | "afterRemoveLiquidity"
  | "beforeSwap"
  | "afterSwap"
  | "beforeDonate"
  | "afterDonate"
  | "beforeSwapReturnDelta"
  | "afterSwapReturnDelta"
  | "afterAddLiquidityReturnDelta"
  | "afterRemoveLiquidityReturnDelta";

export type UniswapV4PoolIntentOptions = {
  chainId?: number;
  poolManager?: string;
  tokenAddress?: string;
  quoteCurrency?: "native" | string;
  fee?: number | "dynamic";
  tickSpacing?: number;
  hookAddress?: string;
  expectedHookPermissions?: UniswapV4HookPermission[];
  initialSqrtPriceX96?: string;
};

const hookFlags: ReadonlyArray<readonly [UniswapV4HookPermission, bigint]> = [
  ["beforeInitialize", ONE_BIGINT << BigInt(13)],
  ["afterInitialize", ONE_BIGINT << BigInt(12)],
  ["beforeAddLiquidity", ONE_BIGINT << BigInt(11)],
  ["afterAddLiquidity", ONE_BIGINT << BigInt(10)],
  ["beforeRemoveLiquidity", ONE_BIGINT << BigInt(9)],
  ["afterRemoveLiquidity", ONE_BIGINT << BigInt(8)],
  ["beforeSwap", ONE_BIGINT << BigInt(7)],
  ["afterSwap", ONE_BIGINT << BigInt(6)],
  ["beforeDonate", ONE_BIGINT << BigInt(5)],
  ["afterDonate", ONE_BIGINT << BigInt(4)],
  ["beforeSwapReturnDelta", ONE_BIGINT << BigInt(3)],
  ["afterSwapReturnDelta", ONE_BIGINT << BigInt(2)],
  ["afterAddLiquidityReturnDelta", ONE_BIGINT << ONE_BIGINT],
  ["afterRemoveLiquidityReturnDelta", ONE_BIGINT],
];

const permissionNames = new Set(hookFlags.map(([permission]) => permission));

function normalizeAddress(value: string) {
  return value.toLowerCase();
}

function currencyAddress(value: "native" | string | undefined) {
  if (value === "native") return UNISWAP_V4_NATIVE_CURRENCY;
  return value ? normalizeAddress(value) : null;
}

function validateAddress(
  value: unknown,
  path: string,
  label: string,
  issues: ValidationIssue[],
) {
  if (value === undefined) return;
  if (typeof value !== "string" || !addressPattern.test(value)) {
    issues.push({ path, code: "format", message: `${label} must be a 20-byte EVM address.` });
  }
}

export function decodeUniswapV4HookPermissions(
  hookAddress: string,
): UniswapV4HookPermission[] {
  if (!addressPattern.test(hookAddress)) {
    throw new ZeitMintValidationError("Uniswap v4 hook address failed validation.", [
      { path: "/hookAddress", code: "format", message: "Hook address must be a 20-byte EVM address." },
    ]);
  }
  const addressValue = BigInt(hookAddress);
  return hookFlags
    .filter(([, flag]) => (addressValue & flag) !== ZERO_BIGINT)
    .map(([permission]) => permission);
}

function samePermissions(
  expected: UniswapV4HookPermission[],
  decoded: UniswapV4HookPermission[],
) {
  return expected.length === decoded.length &&
    expected.every((permission) => decoded.includes(permission));
}

export function validateUniswapV4PoolIntentOptions(
  input: unknown,
): ValidationResult<UniswapV4PoolIntentOptions> {
  if (input === undefined) return { valid: true, value: {}, issues: [] };
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { valid: false, issues: [{ path: "/options", code: "type", message: "Options must be an object." }] };
  }

  const options = input as UniswapV4PoolIntentOptions;
  const record = input as Record<string, unknown>;
  const issues: ValidationIssue[] = [];
  const allowedKeys = new Set([
    "chainId",
    "poolManager",
    "tokenAddress",
    "quoteCurrency",
    "fee",
    "tickSpacing",
    "hookAddress",
    "expectedHookPermissions",
    "initialSqrtPriceX96",
  ]);

  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key)) {
      issues.push({ path: `/options/${key}`, code: "additionalProperties", message: "Unknown Uniswap v4 intent option." });
    }
  }

  if (options.chainId !== undefined && (!Number.isSafeInteger(options.chainId) || options.chainId <= 0)) {
    issues.push({ path: "/options/chainId", code: "range", message: "Chain ID must be a positive safe integer." });
  }
  validateAddress(options.poolManager, "/options/poolManager", "PoolManager", issues);
  validateAddress(options.tokenAddress, "/options/tokenAddress", "Token address", issues);
  if (options.quoteCurrency !== undefined && options.quoteCurrency !== "native") {
    validateAddress(options.quoteCurrency, "/options/quoteCurrency", "Quote currency", issues);
  }
  validateAddress(options.hookAddress, "/options/hookAddress", "Hook address", issues);

  if (
    options.fee !== undefined &&
    options.fee !== "dynamic" &&
    (!Number.isInteger(options.fee) || options.fee < 0 || options.fee > UNISWAP_V4_MAX_STATIC_FEE)
  ) {
    issues.push({
      path: "/options/fee",
      code: "range",
      message: "Static LP fee must be an integer from 0 to 1,000,000 hundredths of a basis point, or dynamic.",
    });
  }
  if (
    options.tickSpacing !== undefined &&
    (!Number.isInteger(options.tickSpacing) ||
      options.tickSpacing < UNISWAP_V4_MIN_TICK_SPACING ||
      options.tickSpacing > UNISWAP_V4_MAX_TICK_SPACING)
  ) {
    issues.push({ path: "/options/tickSpacing", code: "range", message: "Tick spacing must be an integer from 1 to 32,767." });
  }

  if (options.expectedHookPermissions !== undefined) {
    if (!Array.isArray(options.expectedHookPermissions)) {
      issues.push({ path: "/options/expectedHookPermissions", code: "type", message: "Expected hook permissions must be an array." });
    } else {
      const seen = new Set<string>();
      for (const [index, permission] of options.expectedHookPermissions.entries()) {
        if (typeof permission !== "string" || !permissionNames.has(permission as UniswapV4HookPermission)) {
          issues.push({ path: `/options/expectedHookPermissions/${index}`, code: "enum", message: "Unknown Uniswap v4 hook permission." });
        } else if (seen.has(permission)) {
          issues.push({ path: `/options/expectedHookPermissions/${index}`, code: "uniqueItems", message: "Hook permissions must be unique." });
        }
        seen.add(String(permission));
      }
    }
  }

  if (options.initialSqrtPriceX96 !== undefined) {
    if (typeof options.initialSqrtPriceX96 !== "string" || !/^[0-9]+$/.test(options.initialSqrtPriceX96)) {
      issues.push({ path: "/options/initialSqrtPriceX96", code: "format", message: "Initial sqrt price must be an unsigned decimal integer string." });
    } else {
      const price = BigInt(options.initialSqrtPriceX96);
      if (price < MIN_SQRT_PRICE_X96 || price >= MAX_SQRT_PRICE_X96) {
        issues.push({ path: "/options/initialSqrtPriceX96", code: "range", message: "Initial sqrt price is outside Uniswap v4 TickMath bounds." });
      }
    }
  }

  const tokenAddress = typeof options.tokenAddress === "string" && addressPattern.test(options.tokenAddress)
    ? normalizeAddress(options.tokenAddress)
    : null;
  const quoteAddress = options.quoteCurrency === "native"
    ? UNISWAP_V4_NATIVE_CURRENCY
    : typeof options.quoteCurrency === "string" && addressPattern.test(options.quoteCurrency)
      ? normalizeAddress(options.quoteCurrency)
      : null;
  const poolManager = typeof options.poolManager === "string" && addressPattern.test(options.poolManager)
    ? normalizeAddress(options.poolManager)
    : null;
  if (poolManager === UNISWAP_V4_NATIVE_CURRENCY) {
    issues.push({ path: "/options/poolManager", code: "nonZero", message: "PoolManager must be a non-zero contract address." });
  }
  if (tokenAddress === UNISWAP_V4_NATIVE_CURRENCY) {
    issues.push({ path: "/options/tokenAddress", code: "nonZero", message: "Token address must be a non-zero ERC-20 address." });
  }
  if (tokenAddress && quoteAddress && tokenAddress === quoteAddress) {
    issues.push({ path: "/options/quoteCurrency", code: "distinct", message: "Pool currencies must be different." });
  }

  const hookAddress = typeof options.hookAddress === "string" && addressPattern.test(options.hookAddress)
    ? normalizeAddress(options.hookAddress)
    : null;
  const expectedPermissions = Array.isArray(options.expectedHookPermissions)
    ? options.expectedHookPermissions.filter(
        (permission): permission is UniswapV4HookPermission =>
          typeof permission === "string" && permissionNames.has(permission as UniswapV4HookPermission),
      )
    : [];
  if (hookAddress === UNISWAP_V4_NATIVE_CURRENCY && options.fee === "dynamic") {
    issues.push({ path: "/options/hookAddress", code: "dependency", message: "A dynamic-fee pool requires a non-zero hook address." });
  }
  if (hookAddress === UNISWAP_V4_NATIVE_CURRENCY && expectedPermissions.length) {
    issues.push({ path: "/options/hookAddress", code: "dependency", message: "Hook permissions require a non-zero hook address." });
  }
  if (hookAddress && hookAddress !== UNISWAP_V4_NATIVE_CURRENCY) {
    const decoded = decodeUniswapV4HookPermissions(hookAddress);
    if (decoded.length === 0 && options.fee !== "dynamic") {
      issues.push({
        path: "/options/hookAddress",
        code: "hookAddressFlags",
        message: "A static-fee hook address must encode at least one hook permission flag.",
      });
    }

    const returnDeltaDependencies: ReadonlyArray<readonly [UniswapV4HookPermission, UniswapV4HookPermission]> = [
      ["beforeSwapReturnDelta", "beforeSwap"],
      ["afterSwapReturnDelta", "afterSwap"],
      ["afterAddLiquidityReturnDelta", "afterAddLiquidity"],
      ["afterRemoveLiquidityReturnDelta", "afterRemoveLiquidity"],
    ];
    for (const [returnDelta, callback] of returnDeltaDependencies) {
      if (decoded.includes(returnDelta) && !decoded.includes(callback)) {
        issues.push({
          path: "/options/hookAddress",
          code: "hookAddressFlags",
          message: `${returnDelta} requires the ${callback} permission flag.`,
        });
      }
    }

    if (expectedPermissions.length && !samePermissions(expectedPermissions, decoded)) {
      issues.push({
        path: "/options/expectedHookPermissions",
        code: "hookAddressFlags",
        message: "Expected permissions do not match the permission flags encoded in the hook address.",
      });
    }
  }

  return issues.length > 0 ? { valid: false, issues } : { valid: true, value: options, issues: [] };
}

export function createUniswapV4PoolIntent(
  bundle: ZeitMintBundle,
  options: UniswapV4PoolIntentOptions = {},
  generatedAt = new Date().toISOString(),
) {
  const validation = validateUniswapV4PoolIntentOptions(options);
  if (!validation.valid) {
    throw new ZeitMintValidationError("Uniswap v4 pool intent failed validation.", validation.issues);
  }

  const value = validation.value;
  const handoff = createPartnerHandoff(bundle, "uniswap-v4", generatedAt);
  const tokenCurrency = value.tokenAddress ? normalizeAddress(value.tokenAddress) : null;
  const quoteCurrency = currencyAddress(value.quoteCurrency);
  const hookAddress = value.hookAddress
    ? normalizeAddress(value.hookAddress)
    : UNISWAP_V4_NATIVE_CURRENCY;
  const fee = value.fee === "dynamic"
    ? UNISWAP_V4_DYNAMIC_FEE
    : value.fee ?? 3_000;
  const decodedPermissions = hookAddress === UNISWAP_V4_NATIVE_CURRENCY
    ? []
    : decodeUniswapV4HookPermissions(hookAddress);

  const currencies = tokenCurrency && quoteCurrency
    ? [tokenCurrency, quoteCurrency].sort((left, right) =>
        BigInt(left) < BigInt(right) ? -1 : 1,
      )
    : null;
  const missingRequiredFields: string[] = [];
  if (!value.chainId) missingRequiredFields.push("chainId");
  if (!value.poolManager) missingRequiredFields.push("poolManager");
  if (!tokenCurrency) missingRequiredFields.push("poolKey.tokenCurrency");
  if (!quoteCurrency) missingRequiredFields.push("poolKey.quoteCurrency");
  if (!value.initialSqrtPriceX96) missingRequiredFields.push("initialSqrtPriceX96");
  if (value.fee === "dynamic" && !value.hookAddress) missingRequiredFields.push("poolKey.hooks");
  if (value.expectedHookPermissions?.length && !value.hookAddress) missingRequiredFields.push("poolKey.hooks");

  return {
    integration: {
      id: "uniswap-v4",
      version: "1.0",
      mode: "intent-only",
      protocolDependency: "optional",
    },
    generatedAt,
    chain: {
      chainId: value.chainId ?? null,
      poolManager: value.poolManager ? normalizeAddress(value.poolManager) : null,
    },
    token: handoff.token,
    poolKey: {
      currency0: currencies?.[0] ?? null,
      currency1: currencies?.[1] ?? null,
      tokenCurrency,
      quoteCurrency,
      fee,
      feeMode: value.fee === "dynamic" ? "dynamic" : "static",
      tickSpacing: value.tickSpacing ?? 60,
      hooks: hookAddress,
    },
    hook: {
      address: hookAddress,
      expectedPermissions: value.expectedHookPermissions ?? [],
      decodedPermissions,
      permissionsMatch:
        value.expectedHookPermissions === undefined
          ? null
          : samePermissions(value.expectedHookPermissions, decodedPermissions),
    },
    initialization: {
      sqrtPriceX96: value.initialSqrtPriceX96 ?? null,
      ready: missingRequiredFields.length === 0,
    },
    launchContext: {
      creative: handoff.creative,
      utility: handoff.utility,
      mission: handoff.mission,
      readiness: handoff.readiness,
    },
    review: {
      readyForPoolConstruction: missingRequiredFields.length === 0,
      missingRequiredFields,
      valuesAreIntentOnly: true,
      verifyPoolManagerDeployment: true,
      verifyHookBytecodeAndPermissions: true,
      creatorApprovalRequired: true,
      launchpadApprovalRequired: true,
      deploysHook: false,
      initializesPool: false,
      addsLiquidity: false,
      signsTransactions: false,
      movesFunds: false,
    },
  } as const;
}
