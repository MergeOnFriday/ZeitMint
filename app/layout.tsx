import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") || "https";
  const origin = host ? `${protocol}://${host}` : "https://zeitmint.com";

  return {
    title: "ZeitMint — Token launch-readiness and creative kits",
    description:
      "Validate a token project, design useful community missions and package an Emblem-ready, multichain launch handoff.",
    icons: {
      icon: "/favicon.png",
    },
    openGraph: {
      title: "ZeitMint — Make it launch-ready.",
      description: "Free token launch-readiness checks and portable creative handoffs for Emblem, Solana and EVM.",
      type: "website",
      images: [
        {
          url: `${origin}/og-launch-readiness.png`,
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
      images: [`${origin}/og-launch-readiness.png`],
    },
  };
}

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
