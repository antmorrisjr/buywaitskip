import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function sitemap() {
  const { data: games } = await supabase
    .from("games")
    .select("slug, release_date")
    .eq("status", "released");

  const gameUrls = (games || []).map((game) => ({
    url: `https://www.buywaitskip.com/game/${game.slug}`,
    lastModified: game.release_date || new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: "https://www.buywaitskip.com",
      lastModified: new Date().toISOString(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: "https://www.buywaitskip.com/games",
      lastModified: new Date().toISOString(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: "https://www.buywaitskip.com/trending",
      lastModified: new Date().toISOString(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: "https://www.buywaitskip.com/new-releases",
      lastModified: new Date().toISOString(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: "https://www.buywaitskip.com/creators",
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    ...gameUrls,
  ];
}