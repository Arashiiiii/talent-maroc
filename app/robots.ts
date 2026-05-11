import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/cv-ouvrier", "/pricing", "/employeur", "/jobs/"],
        disallow: [
          "/auth/",
          "/dashboard/",
          "/cv/",          // builder is behind auth
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
