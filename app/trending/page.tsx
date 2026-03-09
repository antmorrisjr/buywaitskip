"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BG = "#0A0A12";
const GREEN = "#00E676";
const GOLD = "#FFD740";
const RED = "#FF5252";

const steamHeroImages: Record<string, string> = {
  "elden-ring": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/library_hero.jpg",
  "baldurs-gate-3": "https://m.media-amazon.com/images/M/MV5BN2I0N2Y3MWUtNjJiNy00NjRjLWE4ZTctOTQ2YWVhM2VhMTM4XkEyXkFqcGc@._V1_.jpg",
  "cyberpunk-2077": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/library_hero.jpg",
  "god-of-war-ragnarok": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2322010/library_hero.jpg",
  "hades": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145360/library_hero.jpg",
  "hollow-knight": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367520/library_hero.jpg",
  "red-dead-redemption-2": "https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.webp",
  "helldivers-2": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/553850/library_hero.jpg",
  "black-myth-wukong": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaftpVL32ouEwZLRcznmytgVXiHbiM9xo3bYv15-_SdbsOssKt",
  "metaphor-refantazio": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2679460/library_hero.jpg",
  "astro-bot": "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcTwHe6_x4vYPrJGdVJaq3uKIvDbRAwrgb1D2O38-rsNXRKvqcEz",
  "ff7-rebirth": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2909400/library_hero.jpg",
  "like-a-dragon-infinite-wealth": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2375570/library_hero.jpg",
  "prince-of-persia-lost-crown": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2165300/library_hero.jpg",
  "tekken-8": "https://images.igdb.com/igdb/image/upload/t_cover_big/co7lbb.webp",
  "dragons-dogma-2": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2054970/library_hero.jpg",
  "starfield": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1716740/library_hero.jpg",
  "suicide-squad": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/315210/library_hero.jpg",
  "concord": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2443720/library_hero.jpg",
  "avowed": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2457220/header.jpg",
  "monster-hunter-wilds": "https://static0.polygonimages.com/wordpress/wp-content/uploads/sharedimages/2025/02/monster-hunter-wilds-tag-page-cover-art.jpg?w=1200&h=1200&fit=crop",
  "resident-evil-requiem": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3764200/library_hero.jpg",
  "stellar-blade": "https://preview.redd.it/stellar-blade-logoless-key-art-v0-zaw0l9fqwcic1.jpeg?auto=webp&s=40836c34a4b02d5b5dddb9aee90a90d71b0d4c93",
};

type Game = {
  id: string;
  title: string;
  slug: string;
  cover_url: string;
  genres: string[];
  release_date: string;
  buy: number;
  wait: number;
  skip: number;
  total: number;
};

export default function TrendingPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: gamesData } = await supabase
        .from("games")
        .select("id, title, slug, cover_url, genres, release_date")
        .eq("status", "released");

      const { data: reviews } = await supabase
        .from("reviews")
        .select("game_id, verdict");

      if (!gamesData || !reviews) return;

      const counts: Record<string, { buy: number; wait: number; skip: number; total: number }> = {};
      reviews.forEach((r: any) => {
        if (!counts[r.game_id]) counts[r.game_id] = { buy: 0, wait: 0, skip: 0, total: 0 };
        counts[r.game_id].total++;
        if (r.verdict === "BUY") counts[r.game_id].buy++;
        if (r.verdict === "WAIT") counts[r.game_id].wait++;
        if (r.verdict === "SKIP") counts[r.game_id].skip++;
      });

      const withVerdicts = gamesData
        .filter((g: any) => counts[g.id]?.total >= 3)
        .map((g: any) => {
          const c = counts[g.id] || { buy: 0, wait: 0, skip: 0, total: 0 };
          return {
            ...g,
            buy: Math.round((c.buy / c.total) * 100),
            wait: Math.round((c.wait / c.total) * 100),
            skip: Math.round((c.skip / c.total) * 100),
            total: c.total,
          };
        })
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, 25);

      setGames(withVerdicts);
      setLoading(false);
    }
    fetchData();
  }, []);

  const getVerdict = (game: Game) => {
    if (game.buy >= 60) return { label: "BUY", color: GREEN };
    if (game.skip >= 50) return { label: "SKIP", color: RED };
    return { label: "WAIT", color: GOLD };
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between gap-6 px-6 py-4 border-b border-white/10" style={{ backgroundColor: "rgba(10,10,18,0.95)", backdropFilter: "blur(12px)" }}>
        <a href="/" style={{ textDecoration: "none" }} className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GREEN }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GOLD }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RED }} />
          </div>
          <span className="text-xl font-bold tracking-widest text-white">BUYWAITSKIP</span>
        </a>
        <div className="hidden md:flex items-center gap-8">
  <a href="/" className="text-white/80 hover:text-white font-medium text-sm uppercase tracking-wider transition-colors">Home</a>
  <a href="/trending" className="font-medium text-sm uppercase tracking-wider transition-colors" style={{ color: GREEN }}>Trending</a>
  <a href="/new-releases" className="text-white/80 hover:text-white font-medium text-sm uppercase tracking-wider transition-colors">New Releases</a>
  <a href="/creators" className="text-white/80 hover:text-white font-medium text-sm uppercase tracking-wider transition-colors">Creators</a>
</div>
        <a href="/" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textDecoration: "none" }}>← Back to Home</a>
      </nav>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>Most Reviewed</p>
          <h1 style={{ color: "white", fontSize: 42, fontWeight: "bold", margin: "0 0 12px" }}>Trending Games</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, margin: 0 }}>The top 25 most reviewed games on BuyWaitSkip right now.</p>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
            <p style={{ color: "rgba(255,255,255,0.4)" }}>Loading...</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
            {games.map((game, index) => {
              const image = steamHeroImages[game.slug] || game.cover_url;
              const verdict = getVerdict(game);
              return (
                <a key={game.id} href={`/game/${game.slug}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      position: "relative",
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.08)",
                      backgroundColor: "rgba(255,255,255,0.03)",
                      cursor: "pointer",
                      aspectRatio: "3/4",
                      transition: "transform 0.2s, border-color 0.2s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.borderColor = `${verdict.color}66`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    }}
                  >
                    {/* Rank badge */}
                    <div style={{
                      position: "absolute", top: 10, left: 10, zIndex: 3,
                      width: 28, height: 28, borderRadius: "50%",
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: "bold", color: "rgba(255,255,255,0.7)"
                    }}>
                      {index + 1}
                    </div>

                    {/* Image */}
                    {image ? (
                      <img src={image} alt={game.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))" }} />
                    )}

                    {/* Gradient overlay */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,18,0.97) 0%, rgba(10,10,18,0.4) 50%, transparent 100%)" }} />

                    {/* Bottom content */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 14 }}>
                      {/* Verdict badge */}
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 10, fontWeight: "bold", letterSpacing: "0.1em",
                        textTransform: "uppercase", color: verdict.color,
                        background: `${verdict.color}18`,
                        border: `1px solid ${verdict.color}44`,
                        padding: "3px 8px", borderRadius: 4, marginBottom: 8
                      }}>
                        {verdict.label}
                      </div>

                      <p style={{ color: "white", fontSize: 14, fontWeight: "bold", lineHeight: 1.2, marginBottom: 6 }}>{game.title}</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 8 }}>{game.genres?.slice(0, 2).join(" · ")}</p>

                      {/* Stats */}
                      <div style={{ display: "flex", gap: 8, fontSize: 11, fontWeight: "bold" }}>
                        <span style={{ color: GREEN }}>{game.buy}%</span>
                        <span style={{ color: GOLD }}>{game.wait}%</span>
                        <span style={{ color: RED }}>{game.skip}%</span>
                        <span style={{ color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>{game.total} reviews</span>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
