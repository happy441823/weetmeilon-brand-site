import type { MetadataRoute } from "next";
import { PRIMARY_DOMAIN, PRIMARY_SITE_URL, SITE_URL } from "@/lib/constants";

const publicSearchBots = [
  "*",
  "Googlebot",
  "Bingbot",
  "Baiduspider",
  "Sogou web spider",
  "360Spider",
  "YisouSpider",
  "DuckDuckBot",
  "Applebot"
];

const privatePaths = ["/admin/", "/api/", "/internal/", "/not-for-minors"];

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.NODE_ENV === "production" && !SITE_URL.includes("example.com") && !SITE_URL.includes("localhost");

  return {
    rules: isProduction
      ? publicSearchBots.map((userAgent) => ({
          userAgent,
          allow: "/",
          disallow: privatePaths
        }))
      : {
          userAgent: "*",
          disallow: "/"
        },
    host: PRIMARY_DOMAIN,
    sitemap: `${PRIMARY_SITE_URL}/sitemap.xml`
  };
}
