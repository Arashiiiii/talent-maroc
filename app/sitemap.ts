import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL as BASE, CITY_PAGES } from "@/lib/seo";
import { CV_GUIDES } from "@/lib/cv-guides";

// Regenerate hourly so new jobs reach Google quickly.
export const revalidate = 3600;

// Static pages — ordered by SEO priority
const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: BASE,                   changeFrequency: "daily",   priority: 1.0 },
  { url: `${BASE}/cv`,           changeFrequency: "weekly",  priority: 0.9 },
  { url: `${BASE}/conseils-cv`,  changeFrequency: "weekly",  priority: 0.8 },
  { url: `${BASE}/emploi`,       changeFrequency: "daily",   priority: 0.8 },
  { url: `${BASE}/pricing`,      changeFrequency: "monthly", priority: 0.5 },
  { url: `${BASE}/employeur`,    changeFrequency: "weekly",  priority: 0.5 },
  { url: `${BASE}/privacy`,      changeFrequency: "yearly",  priority: 0.1 },
  { url: `${BASE}/terms`,        changeFrequency: "yearly",  priority: 0.1 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const cityUrls: MetadataRoute.Sitemap = CITY_PAGES.map(c => ({
    url: `${BASE}/emploi/${c.slug}`, lastModified: now, changeFrequency: "daily", priority: 0.8,
  }));

  const guideUrls: MetadataRoute.Sitemap = CV_GUIDES.map(g => ({
    url: `${BASE}/conseils-cv/${g.slug}`, lastModified: new Date(g.updated), changeFrequency: "monthly", priority: 0.7,
  }));

  // Only list live jobs (≤ 60 days). Note: the `jobs` table has no
  // `updated_at` column — selecting it made this query fail silently, which
  // shipped a sitemap with zero job URLs.
  let jobUrls: MetadataRoute.Sitemap = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const since = new Date(Date.now() - 60 * 864e5).toISOString();
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("id, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10000);

    if (error) console.error("[sitemap] jobs query failed:", error.message);
    if (jobs) {
      jobUrls = jobs.map(job => ({
        url:             `${BASE}/jobs/${job.id}`,
        lastModified:    new Date(job.created_at),
        changeFrequency: "weekly" as const,
        priority:        0.7,
      }));
    }
  } catch (e) {
    console.error("[sitemap] jobs fetch threw:", e);
  }

  return [
    ...STATIC_PAGES.map(p => ({ ...p, lastModified: now })),
    ...cityUrls,
    ...guideUrls,
    ...jobUrls,
  ];
}
