import type { MetadataRoute } from "next";

// Crawlers we explicitly welcome. `userAgent: "*"` already permits everyone,
// but naming the major search + AI agents documents intent and survives any
// future tightening of the wildcard rule. AI crawlers are allowed on purpose:
// the public clinic content is meant to be machine-readable and citable.
const ALLOWED_BOTS = [
  // Search engines
  "Googlebot",
  "Googlebot-Image",
  "Bingbot",
  "Slurp", // Yahoo
  "DuckDuckBot",
  "Baiduspider",
  "YandexBot",
  "Applebot",
  // AI / LLM crawlers
  "GPTBot", // OpenAI
  "OAI-SearchBot", // OpenAI search
  "ChatGPT-User", // OpenAI on-demand fetch
  "ClaudeBot", // Anthropic
  "Claude-Web",
  "anthropic-ai",
  "Google-Extended", // Gemini / Vertex training
  "Applebot-Extended",
  "PerplexityBot",
  "Perplexity-User",
  "Amazonbot",
  "Bytespider", // TikTok
  "CCBot", // Common Crawl
  "Meta-ExternalAgent",
  "cohere-ai",
  "Diffbot",
  "YouBot",
];

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const disallow = ["/admin", "/api/", "/login", "/reset-password"];

  return {
    rules: [
      // Default rule for every other crawler.
      { userAgent: "*", allow: "/", disallow },
      // Explicit allow for every named search + AI bot (same private paths blocked).
      ...ALLOWED_BOTS.map((userAgent) => ({ userAgent, allow: "/", disallow })),
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
