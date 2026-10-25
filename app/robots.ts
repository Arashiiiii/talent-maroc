import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/auth/",
          "/dashboard",
          "/cv/",          // per-user CV editor/print pages are private; the /cv landing stays crawlable
          "/protected/",
          "/api/",
          "/success",
          "/employeur/dashboard",
        ],
      },
    ],
    sitemap: "https://talentmaroc.shop/sitemap.xml",
    host:    "https://talentmaroc.shop",
  };
}
