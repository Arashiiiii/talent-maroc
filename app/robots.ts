import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/cv", "/cv-ouvrier", "/pricing", "/employeur", "/jobs/"],
        disallow: [
          "/auth/",
          "/dashboard/",
          "/cv/*",         // per-user CV builder/print pages are private; only the /cv landing page is public
          "/protected/",
          "/api/",
          "/success",
        ],
      },
    ],
    sitemap: "https://talentmaroc.shop/sitemap.xml",
    host:    "https://talentmaroc.shop",
  };
}
