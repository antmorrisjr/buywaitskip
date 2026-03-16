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
  "sekiro": "https://images.igdb.com/igdb/image/upload/t_cover_big/co2a23.webp",
  "red-dead-redemption-2": "https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.webp",
  "witcher-3": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgOPtH8lO6v8aRGGNpdEpaJgtR5GEO1UlnPv33E4-9hyPDQHa7",
  "dark-souls-3": "https://images.igdb.com/igdb/image/upload/t_cover_big/cob9ed.webp",
  "helldivers-2": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/553850/library_hero.jpg",
  "black-myth-wukong": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaftpVL32ouEwZLRcznmytgVXiHbiM9xo3bYv15-_SdbsOssKt",
  "metaphor-refantazio": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2679460/library_hero.jpg",
  "astro-bot": "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcTwHe6_x4vYPrJGdVJaq3uKIvDbRAwrgb1D2O38-rsNXRKvqcEz",
  "ff7-rebirth": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2909400/library_hero.jpg",
  "like-a-dragon-infinite-wealth": "https://images.igdb.com/igdb/image/upload/t_cover_big/co8356.webp",
  "prince-of-persia-lost-crown": "https://images.igdb.com/igdb/image/upload/t_cover_big/co9q1g.webp",
  "tekken-8": "https://images.igdb.com/igdb/image/upload/t_cover_big/co7lbb.webp",
  "dragons-dogma-2": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2054970/library_hero.jpg",
  "starfield": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1716740/library_hero.jpg",
  "skull-and-bones": "https://images.igdb.com/igdb/image/upload/t_cover_big/co4yl7.webp",
  "suicide-squad": "https://images.igdb.com/igdb/image/upload/t_cover_big/co40fu.webp",
  "concord": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2443720/library_hero.jpg",
  "avowed": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2457220/header.jpg",
  "monster-hunter-wilds": "https://static0.polygonimages.com/wordpress/wp-content/uploads/sharedimages/2025/02/monster-hunter-wilds-tag-page-cover-art.jpg?w=1200&h=1200&fit=crop",
  "highguard": "https://images.igdb.com/igdb/image/upload/t_cover_big/cob0ha.webp",
  "expedition-33": "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcQRmrETSJKewyNXWx5IvNNmOhvTOU8mR7CGRRZ6SFAjpyrxHetx",
  "resident-evil-requiem": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3764200/library_hero.jpg",
};

const genreConfig: Record<string, { label: string; icon: string; color: string }> = {
  "action-rpg": { label: "Action RPG", icon: "⚔️", color: "#E74C3C" },
  "open-world": { label: "Open World", icon: "🌍", color: "#27AE60" },
  "rpg": { label: "RPG", icon: "🧙", color: "#9B59B6" },
  "shooter": { label: "Shooter", icon: "🎯", color: "#3498DB" },
  "fighting": { label: "Fighting", icon: "🥊", color: "#E67E22" },
  "platformer": { label: "Platformer", icon: "🕹️", color: "#1ABC9C" },
  "horror": { label: "Horror", icon: "👻", color: "#C0392B" },
  "adventure": { label: "Adventure", icon: "🗺️", color: "#F39C12" },
};

export default function GenrePage({ params }: { params: Promise<{ slug: string }> }) {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState("");

  // First: unwrap params
  useEffect(() => {
    params.then(p => setSlug(p.slug));
  }, []);

  const config = genreConfig[slug] || { label: slug.replace(/-/g, ' '), icon: "🎮", color: "#00E676" };

  // Second: fetch data once slug is ready
  useEffect(() => {
    if (!slug) return;

    async function fetchData() {
      const { data: allGames } = await supabase
        .from('games')
        .select('id, title, slug, developer, genres, release_date, status, cover_url')

        let reviews: any[] = [];
        let page = 0;
        const PAGE_SIZE = 1000;
        while (true) {
          const { data: batch } = await supabase
            .from('reviews')
            .select('game_id, verdict')
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
          if (!batch || batch.length === 0) break;
          reviews = [...reviews, ...batch];
          if (batch.length < PAGE_SIZE) break;
          page++;
        }
      if (!allGames || !reviews) return;

      const genreLabel = genreConfig[slug]?.label || slug.replace(/-/g, ' ');

      const filtered = allGames
        .filter(g => g.genres?.some((genre: string) =>
          genre.toLowerCase().includes(genreLabel.toLowerCase()) ||
          genreLabel.toLowerCase().includes(genre.toLowerCase())
        ))
        .map(game => {
          const gameReviews = reviews.filter(r => r.game_id === game.id);
          const total = gameReviews.length;
          const buy = total ? Math.round((gameReviews.filter(r => r.verdict === 'BUY').length / total) * 100) : 0;
          const wait = total ? Math.round((gameReviews.filter(r => r.verdict === 'WAIT').length / total) * 100) : 0;
          const skip = total ? Math.round((gameReviews.filter(r => r.verdict === 'SKIP').length / total) * 100) : 0;
          return { ...game, buy, wait, skip, total };
        })
        .sort((a, b) => b.buy - a.buy);

      setGames(filtered);
      setLoading(false);
    }

    fetchData();
  }, [slug]);

  const verdictLabel = (game: any) => {
    if (game.buy >= 60) return { label: "BUY", color: GREEN };
    if (game.skip >= 50) return { label: "SKIP", color: RED };
    return { label: "WAIT", color: GOLD };
  };

  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh" }}>
      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(10,10,18,0.95)", backdropFilter: "blur(12px)" }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: GREEN, display: "inline-block" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: GOLD, display: "inline-block" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: RED, display: "inline-block" }} />
          </div>
          <span style={{ color: "white", fontWeight: "bold", fontSize: 18, letterSpacing: "0.15em" }}>BUYWAITSKIP</span>
        </a>
        <a href="/" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textDecoration: "none" }}>← Back to Home</a>
      </nav>

      {/* HERO HEADER */}
      <div style={{ padding: "48px 24px 32px", maxWidth: "1152px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
          <span style={{ fontSize: 48 }}>{config.icon}</span>
          <div>
            <h1 style={{ color: "white", fontSize: 40, fontWeight: "bold", margin: 0, textTransform: "capitalize" }}>{config.label}</h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0 }}>{games.length} games reviewed</p>
          </div>
        </div>
        <div style={{ height: 3, width: 60, backgroundColor: config.color, borderRadius: 2, marginTop: 16 }} />
      </div>

      {/* GAME GRID */}
      <div style={{ padding: "0 24px 60px", maxWidth: "1152px", margin: "0 auto" }}>
        {loading ? (
          <p style={{ color: "rgba(255,255,255,0.4)" }}>Loading...</p>
        ) : games.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.4)" }}>No games found in this genre yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
            {games.map(game => {
              const verdict = verdictLabel(game);
              const image = steamHeroImages[game.slug] || game.cover_url;
              return (
                <a key={game.id} href={`/game/${game.slug}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{ borderRadius: 12, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", transition: "all 0.2s", cursor: "pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                  >
                    <div style={{ position: "relative", width: "100%", height: 220 }}>
                      <div style={{ position: "absolute", inset: 0, backgroundImage: image ? `url(${image})` : undefined, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "rgba(0,0,0,0.3)" }} />
                      <div style={{ position: "absolute", top: 10, right: 10, padding: "4px 10px", borderRadius: 6, backgroundColor: verdict.color, color: BG, fontSize: 11, fontWeight: "bold" }}>
                        {verdict.label}
                      </div>
                      {game.status === 'upcoming' && (
                        <div style={{ position: "absolute", top: 10, left: 10, padding: "4px 10px", borderRadius: 6, backgroundColor: "rgba(255,255,255,0.15)", color: "white", fontSize: 10, fontWeight: "bold", letterSpacing: "0.1em" }}>
                          UPCOMING
                        </div>
                      )}
                    </div>
                    <div style={{ padding: 14 }}>
                      <p style={{ color: "white", fontWeight: 600, fontSize: 14, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{game.title}</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "0 0 10px" }}>{game.developer}</p>
                      <div style={{ display: "flex", gap: 3, height: 4, borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
                        {game.buy > 0 && <div style={{ flex: game.buy, backgroundColor: GREEN }} />}
                        {game.wait > 0 && <div style={{ flex: game.wait, backgroundColor: GOLD }} />}
                        {game.skip > 0 && <div style={{ flex: game.skip, backgroundColor: RED }} />}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: "bold" }}>
                        <span style={{ color: GREEN }}>{game.buy}% BUY</span>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{game.total} reviews</span>
                        <span style={{ color: RED }}>{game.skip}% SKIP</span>
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