import type { MetadataRoute } from "next";

const siteUrl = "https://www.zeitmint.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/sdk-demo.html`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
