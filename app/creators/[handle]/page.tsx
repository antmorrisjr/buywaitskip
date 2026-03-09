"use client";

import { useState, useEffect, use } from "react";
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
  "grand-theft-auto-vi": "https://images.igdb.com/igdb/image/upload/t_cover_big/co9rwo.webp",
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
  "like-a-dragon-infinite-wealth": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2375570/library_hero.jpg",
  "prince-of-persia-lost-crown": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2165300/library_hero.jpg",
  "tekken-8": "https://images.igdb.com/igdb/image/upload/t_cover_big/co7lbb.webp",
  "dragons-dogma-2": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2054970/library_hero.jpg",
  "starfield": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1716740/library_hero.jpg",
  "skull-and-bones": "https://images.igdb.com/igdb/image/upload/t_cover_big/co4yl7.webp",
  "suicide-squad": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/315210/library_hero.jpg",
  "concord": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2443720/library_hero.jpg",
  "avowed": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2457220/header.jpg",
  "monster-hunter-wilds": "https://static0.polygonimages.com/wordpress/wp-content/uploads/sharedimages/2025/02/monster-hunter-wilds-tag-page-cover-art.jpg?w=1200&h=1200&fit=crop",
  "expedition-33": "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcQRmrETSJKewyNXWx5IvNNmOhvTOU8mR7CGRRZ6SFAjpyrxHetx",
  "resident-evil-requiem": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3764200/library_hero.jpg",
  "stellar-blade": "https://preview.redd.it/stellar-blade-logoless-key-art-v0-zaw0l9fqwcic1.jpeg?auto=webp&s=40836c34a4b02d5b5dddb9aee90a90d71b0d4c93",
};

function formatSubs(count: number) {
  if (!count) return "0";
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return count.toString();
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const color = verdict === "BUY" ? GREEN : verdict === "SKIP" ? RED : GOLD;
  return (
    <span style={{ fontSize: 11, fontWeight: "bold", padding: "3px 10px", borderRadius: 4, backgroundColor: `${color}22`, color, border: `1px solid ${color}44`, letterSpacing: "0.05em" }}>
      {verdict}
    </span>
  );
}

export default function CreatorPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params);
  const [creator, setCreator] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "BUY" | "WAIT" | "SKIP">("ALL");

  useEffect(() => {
    async function fetchData() {
      // Try with @ prefix first, then without
let { data: creatorData } = await supabase
.from("creators")
.select("*")
.eq("handle", `@${handle}`)
.maybeSingle();

if (!creatorData) {
const { data } = await supabase
  .from("creators")
  .select("*")
  .eq("handle", handle)
  .maybeSingle();
creatorData = data;
}

if (!creatorData) {
const { data } = await supabase
  .from("creators")
  .select("*")
  .eq("id", handle)
  .maybeSingle();
creatorData = data;
}
      if (!creatorData) { setLoading(false); return; }
      setCreator(creatorData);

      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*, games(title, slug, cover_url, genres)")
        .eq("creator_id", creatorData.id)
        .order("published_at", { ascending: false });

      setReviews(reviewData || []);
      setLoading(false);
    }
    fetchData();
  }, [handle]);

  if (loading) return (
    <div style={{ backgroundColor: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "rgba(255,255,255,0.4)" }}>Loading...</p>
    </div>
  );

  if (!creator) return (
    <div style={{ backgroundColor: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "rgba(255,255,255,0.4)" }}>Creator not found</p>
    </div>
  );

  const buyCount = reviews.filter(r => r.verdict === "BUY").length;
  const waitCount = reviews.filter(r => r.verdict === "WAIT").length;
  const skipCount = reviews.filter(r => r.verdict === "SKIP").length;
  const filteredReviews = filter === "ALL" ? reviews : reviews.filter(r => r.verdict === filter);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
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
  <a href="/trending" className="text-white/80 hover:text-white font-medium text-sm uppercase tracking-wider transition-colors">Trending</a>
  <a href="/new-releases" className="text-white/80 hover:text-white font-medium text-sm uppercase tracking-wider transition-colors">New Releases</a>
  <a href="/creators" className="font-medium text-sm uppercase tracking-wider transition-colors" style={{ color: GREEN }}>Creators</a>
</div>
        <a href="/creators" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textDecoration: "none" }}>← All Creators</a>
      </nav>

      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "48px 24px", background: "linear-gradient(135deg, rgba(0,230,118,0.05) 0%, rgba(10,10,18,0) 60%)" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto", display: "flex", alignItems: "center", gap: 32 }}>
          <img
            src={creator.avatar_url}
            alt={creator.name}
            style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.1)", flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>Creator Profile</p>
            <h1 style={{ color: "white", fontSize: 42, fontWeight: "bold", margin: "0 0 4px" }}>{creator.name}</h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 24px" }}>
              {creator.handle} · {formatSubs(creator.subscriber_count)} subscribers
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={{ padding: "12px 20px", borderRadius: 8, backgroundColor: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.2)", textAlign: "center", minWidth: 80 }}>
                <p style={{ color: GREEN, fontSize: 24, fontWeight: "bold", margin: 0 }}>{buyCount}</p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: "2px 0 0", textTransform: "uppercase" }}>BUY</p>
              </div>
              <div style={{ padding: "12px 20px", borderRadius: 8, backgroundColor: "rgba(255,215,64,0.1)", border: "1px solid rgba(255,215,64,0.2)", textAlign: "center", minWidth: 80 }}>
                <p style={{ color: GOLD, fontSize: 24, fontWeight: "bold", margin: 0 }}>{waitCount}</p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: "2px 0 0", textTransform: "uppercase" }}>WAIT</p>
              </div>
              <div style={{ padding: "12px 20px", borderRadius: 8, backgroundColor: "rgba(255,82,82,0.1)", border: "1px solid rgba(255,82,82,0.2)", textAlign: "center", minWidth: 80 }}>
                <p style={{ color: RED, fontSize: 24, fontWeight: "bold", margin: 0 }}>{skipCount}</p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: "2px 0 0", textTransform: "uppercase" }}>SKIP</p>
              </div>
              <div style={{ padding: "12px 20px", borderRadius: 8, backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center", minWidth: 80 }}>
                <p style={{ color: "white", fontSize: 24, fontWeight: "bold", margin: 0 }}>{reviews.length}</p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: "2px 0 0", textTransform: "uppercase" }}>Total</p>
              </div>
              {creator.youtube_channel_id && !creator.youtube_channel_id.startsWith("http") && (
                <a
                  href={`https://youtube.com/channel/${creator.youtube_channel_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: "12px 20px", borderRadius: 8, backgroundColor: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.3)", color: "#FF4444", fontSize: 13, fontWeight: "bold", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
                >
                  ▶ YouTube
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <h2 style={{ color: "white", fontSize: 13, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.2em", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-block", width: 3, height: 16, backgroundColor: GREEN, borderRadius: 2 }} />
            All Reviews ({filteredReviews.length})
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            {(["ALL", "BUY", "WAIT", "SKIP"] as const).map(v => {
              const color = v === "BUY" ? GREEN : v === "WAIT" ? GOLD : v === "SKIP" ? RED : "white";
              const isActive = filter === v;
              return (
                <button
                  key={v}
                  onClick={() => setFilter(v)}
                  style={{
                    fontSize: 11,
                    fontWeight: "bold",
                    padding: "6px 14px",
                    borderRadius: 6,
                    cursor: "pointer",
                    letterSpacing: "0.05em",
                    backgroundColor: isActive ? `${color}22` : "rgba(255,255,255,0.05)",
                    border: `1px solid ${isActive ? `${color}55` : "rgba(255,255,255,0.1)"}`,
                    color: isActive ? color : "rgba(255,255,255,0.5)",
                    transition: "all 0.15s",
                  }}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
            No reviews found
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {filteredReviews.map(review => {
              const coverImage = steamHeroImages[review.games?.slug] || review.games?.cover_url;
              return (
                <a key={review.id} href={`/game/${review.games?.slug}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, border-color 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                  >
                    <div style={{ height: 130, backgroundImage: coverImage ? `url(${coverImage})` : undefined, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "rgba(255,255,255,0.05)" }} />
                    <div style={{ padding: 14 }}>
                      <p style={{ color: "white", fontWeight: "bold", fontSize: 13, margin: "0 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {review.games?.title}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: review.creator_quote ? 8 : 0 }}>
                        <VerdictBadge verdict={review.verdict} />
                        {review.is_sponsored && (
                          <span style={{ fontSize: 10, color: GOLD, backgroundColor: "rgba(255,215,64,0.1)", border: "1px solid rgba(255,215,64,0.3)", padding: "2px 6px", borderRadius: 4 }}>Sponsored</span>
                        )}
                      </div>
                      {review.creator_quote && (
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: "8px 0 0", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          "{review.creator_quote}"
                        </p>
                      )}
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
