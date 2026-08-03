import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.zeitmint.com"),
  applicationName: "ZeitMint",
  title: {
    default: "ZeitMint — Token launch-readiness and creative kits",
    template: "%s · ZeitMint",
  },
  description:
    "Validate a token project, design useful community missions and package an Emblem-ready, multichain launch handoff.",
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.png" },
  openGraph: {
    title: "ZeitMint — Make it launch-ready.",
    description: "Free token launch-readiness checks and portable creative handoffs for Emblem, Solana and EVM.",
    url: "/",
    siteName: "ZeitMint",
    type: "website",
    images: [
      {
        url: "/og-launch-readiness.png",
        width: 1731,
        height: 909,
        alt: "ZeitMint — Make it launch-ready.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZeitMint — Make it launch-ready.",
    description: "Free token launch-readiness checks and portable creative handoffs for Emblem, Solana and EVM.",
    images: ["/og-launch-readiness.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0d0c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
