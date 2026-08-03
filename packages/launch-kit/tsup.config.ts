import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "launch-kit": "src/launch-kit.ts",
    "utility-manifest": "src/utility-manifest.ts",
    readiness: "src/readiness.ts",
    "adapters/launchpad": "src/adapters/launchpad.ts",
    "integrations/uniswap-v4": "src/integrations/uniswap-v4.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "es2022",
  splitting: false,
  treeshake: true,
});
