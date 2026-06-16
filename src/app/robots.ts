import type { MetadataRoute } from "next";
import { PRIMARY_SITE_URL, SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.NODE_ENV === "production" && !SITE_URL.includes("example.com") && !SITE_URL.includes("localhost");

  return {
    rules: isProduction
      ? {
          userAgent: "*",
          allow: "/",
          disallow: ["/admin/", "/api/", "/internal/", "/not-for-minors"]
        }
      : {
          userAgent: "*",
          disallow: "/"
        },
    sitemap: `${PRIMARY_SITE_URL}/sitemap.xml`
  };
}
