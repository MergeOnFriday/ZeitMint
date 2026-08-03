import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ZeitMint",
    short_name: "ZeitMint",
    description: "Token launch-readiness, utility manifests and portable launch kits.",
    start_url: "/",
    display: "standalone",
    background_color: "#f2f0e9",
    theme_color: "#0b0d0c",
    icons: [{ src: "/favicon.png", sizes: "96x96", type: "image/png" }],
  };
}
