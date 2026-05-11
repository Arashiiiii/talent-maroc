import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE = "https://talentmaroc.shop";

// Static pages — ordered by SEO priority
const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: BASE,                   lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
  { url: `${BASE}/cv-ouvrier`,   lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9 },
  { url: `${BASE}/pricing`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE}/employeur`,    lastModified: new Date(), changeFrequency: "weekly",  priority: 0.6 },
  { url: `${BASE}/privacy`,      lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
  { url: `${BASE}/terms`,        lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all public job IDs for dynamic routes
  let jobUrls: MetadataRoute.Sitemap = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(5000); // sitemap spec max is 50k URLs; cap at 5k for safety

    if (jobs) {
      jobUrls = jobs.map((job) => ({
        url:              `${BASE}/jobs/${job.id}`,
        lastModified:     new Date(job.updated_at ?? job.created_at),
        changeFrequency:  "weekly" as const,
        priority:         0.8,
      }));
    }
  } catch {
    // Silently skip dynamic URLs if DB is unreachable during build
  }

  return [...STATIC_PAGES, ...jobUrls];
}
