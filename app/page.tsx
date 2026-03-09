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
  "alan-wake-2": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1276670/library_hero.jpg",
  "anthem": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1238820/library_hero.jpg",
"arc-raiders": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1808500/library_hero.jpg",
  "assassins-creed-shadows": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2971460/library_hero.jpg",
  "astro-bot": "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcTwHe6_x4vYPrJGdVJaq3uKIvDbRAwrgb1D2O38-rsNXRKvqcEz",
  "avowed": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2457220/library_hero.jpg",
  "babylons-fall": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1307650/library_hero.jpg",
  "balatro": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2379780/library_hero.jpg",
  "baldurs-gate-3": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1086940/library_hero.jpg",
  "black-myth-wukong": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2358720/library_hero.jpg",
  "borderlands-4": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2105450/library_hero.jpg",
  "clair-obscur-expedition-33": "https://cdn1.epicgames.com/spt-assets/330dace5ffc74156987f91d454ac544b/project-w-1kt2x.jpg",
  "concord": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2443720/library_hero.jpg",
  "dead-space-remake": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1693980/library_hero.jpg",
  "death-stranding-2": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2214002/library_hero.jpg",
  "donkey-kong-bananza": "https://images.igdb.com/igdb/image/upload/t_screenshot_big/scefnk.jpg",
  "dragon-age-the-veilguard": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1845910/library_hero.jpg",
  "dragons-dogma-2": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2054970/library_hero.jpg",
  "dustborn": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1726780/library_hero.jpg",
  "elden-ring": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/library_hero.jpg",
  "final-fantasy-vii-rebirth": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2909400/library_hero.jpg",
  "final-fantasy-xvi": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2515020/library_hero.jpg",
  "forspoken": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1680880/library_hero.jpg",
  "ghost-of-tsushima": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2215430/library_hero.jpg",
  "god-of-war-ragnarok": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2322010/library_hero.jpg",
  "grand-theft-auto-vi": "https://images.igdb.com/igdb/image/upload/t_cover_big/co9rwo.webp",
  "hades-2": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145350/library_hero.jpg",
  "helldivers-2": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/553850/library_hero.jpg",
  "highguard": "https://www.cnet.com/a/img/resize/370610a139efbac2d741e598d555d68044bafa27/hub/2026/01/24/a2ed50da-1775-408e-830f-abca4ca4f241/highguard-logo-splash.jpg?auto=webp&fit=crop&height=675&width=1200",
  "hogwarts-legacy": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/990080/library_hero.jpg",
  "lies-of-p": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1627720/library_hero.jpg",
  "mario-kart-world": "https://images.igdb.com/igdb/image/upload/t_screenshot_big/scefnl.jpg",
  "marvel-rivals": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2767030/library_hero.jpg",
  "metaphor-refantazio": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2679460/library_hero.jpg",
  "monster-hunter-wilds": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2246340/library_hero.jpg",
  "mortal-kombat-1": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1971870/library_hero.jpg",
  "palworld": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1623730/library_hero.jpg",
  "reanimal": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2923810/library_hero.jpg",
  "redfall": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1294810/library_hero.jpg",
  "resident-evil-4-remake": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2050650/library_hero.jpg",
  "resident-evil-village": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1196590/library_hero.jpg",
  "resident-evil-requiem": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3764200/library_hero.jpg",
  "silent-hill-2-remake": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2124490/library_hero.jpg",
  "silent-hill-f": "https://images.igdb.com/igdb/image/upload/t_screenshot_big/scefno.jpg",
  "skull-and-bones": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1343400/library_hero.jpg",
  "spider-man-2": "https://images.igdb.com/igdb/image/upload/t_cover_big/cobg1k.webp",
  "split-fiction": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2001120/library_hero.jpg",
  "star-wars-outlaws": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2588570/library_hero.jpg",
  "stellar-blade": "https://preview.redd.it/stellar-blade-logoless-key-art-v0-zaw0l9fqwcic1.jpeg?auto=webp&s=40836c34a4b02d5b5dddb9aee90a90d71b0d4c93",
  "street-fighter-6": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1364780/library_hero.jpg",
  "suicide-squad-kill-the-justice-league": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/315210/library_hero.jpg",
  "tekken-8": "https://static.bandainamcoent.eu/high/tekken/tekken-8/00-page-setup/TEKKEN8_Header_mobile_2.jpg",
  "crimson-desert": "https://images.igdb.com/igdb/image/upload/t_cover_big/coaqai.webp",
"forza-horizon-6": "https://images.igdb.com/igdb/image/upload/t_cover_big/cobc5n.webp",
"phantom-blade-zero": "https://images.igdb.com/igdb/image/upload/t_cover_big/cob64v.webp",
"tides-of-annihilation": "https://images.igdb.com/igdb/image/upload/t_cover_big/coaveg.webp",
"marvel-tokon-fighting-souls": "https://images.igdb.com/igdb/image/upload/t_cover_big/co9wwj.webp",
"marathon": "https://media.overclock3d.net/2025/04/Bungie-Marathon.jpg",
};

const tickerVerdicts = [
  { game: "Resident Evil Requiem", verdict: "BUY", color: GREEN },
  { game: "Skull and Bones", verdict: "SKIP", color: RED },
  { game: "Elden Ring", verdict: "BUY", color: GREEN },
  { game: "Dragon Age: The Veilguard", verdict: "WAIT", color: GOLD },
  { game: "Concord", verdict: "SKIP", color: RED },
  { game: "Baldur's Gate 3", verdict: "BUY", color: GREEN },
  { game: "Avowed", verdict: "WAIT", color: GOLD },
  { game: "Forspoken", verdict: "SKIP", color: RED },
  { game: "Split Fiction", verdict: "BUY", color: GREEN },
  { game: "Helldivers 2", verdict: "WAIT", color: GOLD },
  { game: "Suicide Squad: Kill the Justice League", verdict: "SKIP", color: RED },
  { game: "Silent Hill 2 Remake", verdict: "BUY", color: GREEN },
  { game: "Palworld", verdict: "WAIT", color: GOLD },
  { game: "Redfall", verdict: "SKIP", color: RED },
  { game: "Black Myth: Wukong", verdict: "BUY", color: GREEN },
  { game: "Assassin's Creed Shadows", verdict: "WAIT", color: GOLD },
  { game: "Dustborn", verdict: "SKIP", color: RED },
  { game: "Stellar Blade", verdict: "BUY", color: GREEN },
  { game: "Marvel Rivals", verdict: "WAIT", color: GOLD },
  { game: "Babylon's Fall", verdict: "SKIP", color: RED },
  { game: "Monster Hunter Wilds", verdict: "BUY", color: GREEN },
  { game: "Star Wars Outlaws", verdict: "WAIT", color: GOLD },
  { game: "Reanimal", verdict: "BUY", color: GREEN },
  { game: "Dragon's Dogma 2", verdict: "WAIT", color: GOLD },
  { game: "Hades 2", verdict: "BUY", color: GREEN },
  { game: "Tekken 8", verdict: "BUY", color: GREEN },
  { game: "Astro Bot", verdict: "BUY", color: GREEN },
  { game: "Silent Hill f", verdict: "BUY", color: GREEN },
  { game: "Street Fighter 6", verdict: "BUY", color: GREEN },
  { game: "Metaphor: ReFantazio", verdict: "BUY", color: GREEN },
];

type Game = {
  id: string;
  title: string;
  slug: string;
  developer: string;
  genres: string[];
  featured: boolean;
  featured_order: number;
  status: string;
  cover_url: string;
  buy: number;
  wait: number;
  skip: number;
  backgroundImage: string;
  release_date: string;
};

type Creator = {
  id: string;
  name: string;
  handle: string;
  avatar_url: string;
};

function GameCard({ title, slug, buy, wait, skip, cover_url }: { title: string; slug: string; buy: number; wait: number; skip: number; cover_url?: string }) {
  const image = cover_url || steamHeroImages[slug];
  return (
    <a href={`/game/${slug}`} style={{ textDecoration: "none" }}>
      <div
        style={{ flexShrink: 0, width: "180px", borderRadius: "12px", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.06)", transition: "transform 0.2s", cursor: "pointer" }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        <div style={{ width: "100%", height: "240px", backgroundImage: image ? `url(${image})` : undefined, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: image ? undefined : "rgba(255,255,255,0.08)" }} />
        <div style={{ padding: "12px" }}>
          <p style={{ color: "white", fontWeight: 600, fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px", fontSize: "12px", fontWeight: "bold" }}>
            <span style={{ color: GREEN }}>BUY {buy}%</span>
            <span style={{ color: GOLD }}>WAIT {wait}%</span>
            <span style={{ color: RED }}>SKIP {skip}%</span>
          </div>
        </div>
      </div>
    </a>
  );
}

function HeroCarousel({ games }: { games: Game[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState(0);
  const [fading, setFading] = useState(false);

  const goTo = (index: number) => {
    if (index === currentSlide) return;
    setPrevSlide(currentSlide);
    setFading(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setFading(false);
    }, 600);
  };

  useEffect(() => {
    if (games.length === 0) return;
    const interval = setInterval(() => {
      goTo((currentSlide + 1) % games.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [games.length, currentSlide]);

  if (games.length === 0) return null;

  const game = games[currentSlide];
  const prev = games[prevSlide];

  return (
    <section style={{ backgroundColor: BG, padding: "24px" }}>
      <div style={{ maxWidth: "1152px", margin: "0 auto" }}>
        <a href={`/game/${game.slug}`} style={{ textDecoration: "none", display: "block" }}>
          <div style={{ position: "relative", width: "100%", height: "520px", borderRadius: "16px", overflow: "hidden", cursor: "pointer" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${prev.backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center", opacity: fading ? 1 : 0, transition: "opacity 0.6s ease-in-out", filter: "brightness(1.15)" }} />
            <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${game.backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center", opacity: fading ? 0 : 1, transition: "opacity 0.6s ease-in-out", filter: "brightness(1.15)" }} />
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 40%, rgba(10,10,18,0.85) 100%)", zIndex: 2 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,18,0.97) 0%, rgba(10,10,18,0.5) 25%, transparent 50%)", zIndex: 2 }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, padding: "2rem", width: "60%", zIndex: 3 }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "8px" }}>{game.developer}</p>
              {game.status === 'upcoming' && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 6, backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: "bold", color: "white", letterSpacing: "0.15em", textTransform: "uppercase" }}>🕐 Reviews Coming Soon</span>
                </div>
              )}
              <h1 style={{ color: "white", fontSize: "48px", fontWeight: "bold", lineHeight: 1.1, marginBottom: "8px" }}>{game.title}</h1>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", marginBottom: "24px" }}>{game.genres?.join(" · ")}</p>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ backgroundColor: "rgba(0,230,118,0.15)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px 20px", minWidth: "90px", textAlign: "center" }}>
                  <p style={{ color: GREEN, fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "4px" }}>Buy</p>
                  <p style={{ color: "white", fontSize: "24px", fontWeight: "bold" }}>{game.buy}%</p>
                </div>
                <div style={{ backgroundColor: "rgba(255,215,64,0.15)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px 20px", minWidth: "90px", textAlign: "center" }}>
                  <p style={{ color: GOLD, fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "4px" }}>Wait</p>
                  <p style={{ color: "white", fontSize: "24px", fontWeight: "bold" }}>{game.wait}%</p>
                </div>
                <div style={{ backgroundColor: "rgba(255,82,82,0.15)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px 20px", minWidth: "90px", textAlign: "center" }}>
                  <p style={{ color: RED, fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "4px" }}>Skip</p>
                  <p style={{ color: "white", fontSize: "24px", fontWeight: "bold" }}>{game.skip}%</p>
                </div>
              </div>
            </div>
            <button onClick={e => { e.preventDefault(); goTo((currentSlide - 1 + games.length) % games.length); }} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 }}>‹</button>
            <button onClick={e => { e.preventDefault(); goTo((currentSlide + 1) % games.length); }} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 }}>›</button>
            <div style={{ position: "absolute", bottom: "24px", right: "24px", display: "flex", gap: "8px", alignItems: "center", zIndex: 3 }}>
              {games.map((_, index) => (
                <button key={index} onClick={e => { e.preventDefault(); goTo(index); }} style={{ width: currentSlide === index ? "28px" : "8px", height: "8px", borderRadius: "9999px", backgroundColor: currentSlide === index ? GREEN : "rgba(255,255,255,0.4)", border: "none", cursor: "pointer", transition: "all 0.3s", padding: 0 }} />
              ))}
            </div>
          </div>
        </a>
      </div>
    </section>
  );
}

function GenreSection({ allGames }: { allGames: Game[] }) {
  const genres = [
    { label: "Action RPG", icon: "⚔️", color: "#E74C3C" },
    { label: "Open World", icon: "🌍", color: "#27AE60" },
    { label: "RPG", icon: "🧙", color: "#9B59B6" },
    { label: "Shooter", icon: "🎯", color: "#3498DB" },
    { label: "Fighting", icon: "🥊", color: "#E67E22" },
    { label: "Platformer", icon: "🕹️", color: "#1ABC9C" },
    { label: "Horror", icon: "👻", color: "#C0392B" },
    { label: "Adventure", icon: "🗺️", color: "#F39C12" },
  ];

  const preferredSlugs: Record<string, string> = {
    "Action RPG": "elden-ring",
    "Open World": "hogwarts-legacy",
    "RPG": "final-fantasy-vii-rebirth",
    "Shooter": "arc-raiders",
    "Fighting": "tekken-8",
    "Platformer": "astro-bot",
    "Horror": "resident-evil-requiem",
    "Adventure": "spider-man-2",
  };

  const genresWithData = genres.map(g => {
    const matches = allGames.filter(game =>
      game.genres?.some(genre =>
        genre.toLowerCase().includes(g.label.toLowerCase()) ||
        g.label.toLowerCase().includes(genre.toLowerCase())
      )
    );
    const preferred = preferredSlugs[g.label];
    const sample = (preferred && matches.find(m => m.slug === preferred)) || matches[0];
    return { ...g, count: matches.length, sampleGame: sample };
  }).filter(g => g.count > 0);

  return (
    <section style={{ padding: "48px 24px 80px" }}>
      <div style={{ maxWidth: "1152px", margin: "0 auto" }}>
        <h2 style={{ color: "white", fontSize: 24, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 28 }}>Browse by Genre</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {genresWithData.map((genre) => {
            const bgImage = genre.sampleGame
              ? (steamHeroImages[genre.sampleGame.slug] || genre.sampleGame.cover_url)
              : undefined;
            return (
              <a key={genre.label} href={`/genre/${genre.label.toLowerCase().replace(/ /g, '-')}`} style={{ textDecoration: "none", display: "block" }}>
                <div
                  style={{ position: "relative", height: 260, borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  {bgImage && <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.45)" }} />}
                  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${genre.color}55, transparent)` }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)" }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 20 }}>
                    <span style={{ fontSize: 36, marginBottom: 8 }}>{genre.icon}</span>
                    <p style={{ color: "white", fontWeight: "bold", fontSize: 18, margin: 0 }}>{genre.label}</p>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: "4px 0 0" }}>{genre.count} games reviewed</p>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [featuredGames, setFeaturedGames] = useState<Game[]>([]);
  const [trendingGames, setTrendingGames] = useState<Game[]>([]);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [allCreators, setAllCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: games, error } = await supabase
        .from('games')
        .select('id, title, slug, developer, genres, release_date, featured, featured_order, status, cover_url');
      if (error) { console.error('Error:', error); return; }

      const { data: reviews, error: reviewError } = await supabase
        .from('reviews')
        .select('game_id, verdict');
      if (reviewError) { console.error('Reviews error:', reviewError); return; }

      const { data: creatorsData } = await supabase
        .from('creators')
        .select('id, name, handle, avatar_url')
        .not('avatar_url', 'is', null);
      setAllCreators(creatorsData || []);

      const gamesWithVerdicts = games.map((game: any) => {
        const gameReviews = reviews.filter((r: any) => r.game_id === game.id);
        const total = gameReviews.length;
        const buy = total ? Math.round((gameReviews.filter((r: any) => r.verdict === 'BUY').length / total) * 100) : 0;
        const wait = total ? Math.round((gameReviews.filter((r: any) => r.verdict === 'WAIT').length / total) * 100) : 0;
        const skip = total ? Math.round((gameReviews.filter((r: any) => r.verdict === 'SKIP').length / total) * 100) : 0;
        return {
          ...game,
          buy,
          wait,
          skip,
          backgroundImage: steamHeroImages[game.slug] || game.cover_url || '',
        };
      });

      const featured = gamesWithVerdicts
        .filter((g: any) => g.featured)
        .sort((a: any, b: any) => (a.featured_order || 99) - (b.featured_order || 99))
        .slice(0, 6);
      const trending = [...gamesWithVerdicts].filter((g: any) => g.status !== 'upcoming').sort((a: any, b: any) => b.buy - a.buy).slice(0, 20);
      const recent = [...gamesWithVerdicts].filter((g: any) => g.status !== 'upcoming').sort((a: any, b: any) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime()).slice(0, 20);
      const upcoming = gamesWithVerdicts
        .filter((g: any) => g.status === 'upcoming')
        .sort((a: any, b: any) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime());

      setFeaturedGames(featured);
      setTrendingGames(trending);
      setRecentGames(recent);
      setUpcomingGames(upcoming);
      setAllGames(gamesWithVerdicts);
      setLoading(false);
    }
    fetchData();
  }, []);

  const matchingGames = allGames.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 4);
  const matchingCreators = allCreators.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 2);
  const hasResults = matchingGames.length > 0 || matchingCreators.length > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      <nav className="sticky top-0 z-50 flex items-center justify-between gap-6 px-6 py-4 border-b border-white/10" style={{ backgroundColor: "rgba(10,10,18,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GREEN }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GOLD }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RED }} />
          </div>
          <span className="text-xl font-bold tracking-widest text-white">BUYWAITSKIP</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-white/80 hover:text-white font-medium text-sm uppercase tracking-wider transition-colors">Trending</a>
          <a href="/new-releases" className="text-white/80 hover:text-white font-medium text-sm uppercase tracking-wider transition-colors">New Releases</a>
          <a href="/creators" className="text-white/80 hover:text-white font-medium text-sm uppercase tracking-wider transition-colors">Creators</a>
          <a href="/games" className="text-white/80 hover:text-white font-medium text-sm uppercase tracking-wider transition-colors">All Games</a>
        </div>
        <div className="flex-1 max-w-xs hidden sm:block" style={{ position: "relative" }}>
          <input
            type="search"
            placeholder="Search games & creators..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 300)}
            className="w-full rounded-full px-4 py-2 text-sm bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
          />
          {searchOpen && searchQuery.length > 0 && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, backgroundColor: "#13131f", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, overflow: "hidden", zIndex: 100, boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}>
              {/* Games */}
              {matchingGames.map(game => {
                const searchImage = steamHeroImages[game.slug] || game.cover_url;
                return (
                  <a key={game.id} href={`/game/${game.slug}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 6, backgroundImage: searchImage ? `url(${searchImage})` : undefined, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "rgba(255,255,255,0.1)", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: "white", fontSize: 13, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{game.title}</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>{game.genres?.join(" · ")}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: "bold", padding: "2px 8px", borderRadius: 4, backgroundColor: game.buy >= 60 ? "rgba(0,230,118,0.2)" : game.skip >= 50 ? "rgba(255,82,82,0.2)" : "rgba(255,215,64,0.2)", color: game.buy >= 60 ? GREEN : game.skip >= 50 ? RED : GOLD }}>
                      {game.buy >= 60 ? "BUY" : game.skip >= 50 ? "SKIP" : "WAIT"}
                    </span>
                  </a>
                );
              })}
              {/* Divider if both exist */}
              {matchingGames.length > 0 && matchingCreators.length > 0 && (
                <div style={{ padding: "4px 14px", fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", backgroundColor: "rgba(255,255,255,0.02)" }}>Creators</div>
              )}
              {/* Creators */}
              {matchingCreators.map(creator => (
                <a key={creator.id} href={`/creators/${creator.handle?.replace('@', '') || creator.id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <img src={creator.avatar_url} alt={creator.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "white", fontSize: 13, fontWeight: 600, margin: 0 }}>{creator.name}</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>{creator.handle}</p>
                  </div>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Creator →</span>
                </a>
              ))}
              {/* No results */}
              {!hasResults && (
                <div style={{ padding: "16px 14px", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>No results found</div>
              )}
            </div>
          )}
        </div>
      </nav>

      <div className="border-b border-white/10 overflow-hidden py-2" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
        <div className="flex w-max animate-ticker">
          {[...tickerVerdicts, ...tickerVerdicts].map((item, i) => (
            <div key={i} className="flex items-center gap-4 mx-6 whitespace-nowrap">
              <span className="text-white/70 text-sm font-medium">{item.game}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: BG, backgroundColor: item.color }}>{item.verdict}</span>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ height: "520px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.4)" }}>Loading...</p>
        </div>
      ) : (
        <HeroCarousel games={featuredGames} />
      )}

      <section style={{ position: "relative", padding: "60px 24px", overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(135deg, rgba(0,230,118,0.08) 0%, rgba(10,10,18,0) 60%)" }}>
        <div style={{ maxWidth: "1152px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40 }}>
          <div style={{ maxWidth: 600 }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>Why BuyWaitSkip?</p>
            <h2 style={{ color: "white", fontSize: 42, fontWeight: "bold", lineHeight: 1.2, marginBottom: 20 }}>
              We don't tell you<br />what to think.
            </h2>
            <h3 style={{ color: GREEN, fontSize: 42, fontWeight: "bold", lineHeight: 1.2, marginBottom: 28 }}>
              We show you what<br />everyone else thinks.
            </h3>
            <p style={{ color: "white", fontSize: 16, lineHeight: 1.8 }}>
              <span style={{ color: "white" }}>Gaming reviews</span> are scattered across hundreds of YouTube channels. We track the creators you already trust, analyze their honest takes, and give you one simple verdict — <strong style={{ color: GREEN }}>BUY</strong>, <strong style={{ color: GOLD }}>WAIT</strong>, or <strong style={{ color: RED }}>SKIP</strong> — so you never waste $70 on a game again.
            </p>
          </div>
          <div style={{ flexShrink: 0, display: "flex", gap: 16 }}>
            <div style={{ textAlign: "center", padding: "24px 32px", borderRadius: 12, backgroundColor: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)" }}>
              <p style={{ color: GREEN, fontSize: 36, fontWeight: "bold", margin: 0 }}>{allGames.length}+</p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.1em" }}>Games Reviewed</p>
            </div>
            <div style={{ textAlign: "center", padding: "24px 32px", borderRadius: 12, backgroundColor: "rgba(255,215,64,0.1)", border: "1px solid rgba(255,215,64,0.3)" }}>
              <p style={{ color: GOLD, fontSize: 36, fontWeight: "bold", margin: 0 }}>162+</p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.1em" }}>Trusted Creators</p>
            </div>
            <div style={{ textAlign: "center", padding: "24px 32px", borderRadius: 12, backgroundColor: "rgba(255,82,82,0.1)", border: "1px solid rgba(255,82,82,0.3)" }}>
              <p style={{ color: RED, fontSize: 36, fontWeight: "bold", margin: 0 }}>$0</p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.1em" }}>Paid Reviews</p>
            </div>
          </div>
        </div>
      </section>

      {!loading && upcomingGames.length > 0 && (
  <section style={{ padding: "48px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
    <div style={{ maxWidth: "1152px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h2 style={{ color: "white", fontSize: 13, fontWeight: "bold", letterSpacing: "0.2em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 10, margin: 0 }}>
          <span style={{ display: "inline-block", width: 3, height: 16, backgroundColor: GOLD, borderRadius: 2 }} />
          Coming Soon
        </h2>
        <span style={{ fontSize: 11, fontWeight: "bold", color: GOLD, letterSpacing: "0.15em", textTransform: "uppercase", background: "rgba(255,215,64,0.1)", border: "1px solid rgba(255,215,64,0.3)", padding: "4px 10px", borderRadius: 20 }}>
          🕐 Reviews Incoming
        </span>
      </div>
      <div style={{ position: "relative" }}>
        <button
          onClick={() => document.getElementById('upcoming-scroll')!.scrollBy({ left: -400, behavior: 'smooth' })}
          style={{ position: "absolute", left: -16, top: "50%", transform: "translateY(-50%)", zIndex: 10, width: 40, height: 40, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
        <div id="upcoming-scroll" className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
          {upcomingGames.map((game) => (
            <a key={game.id} href={`/game/${game.slug}`} style={{ textDecoration: "none", flexShrink: 0 }}>
              <div
                style={{ width: "300px", height: "420px", position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)", cursor: "pointer", transition: "transform 0.2s, border-color 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(255,215,64,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
              >
                {(steamHeroImages[game.slug] || game.cover_url) ? (
                  <img src={steamHeroImages[game.slug] || game.cover_url} alt={game.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))" }} />
                )}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,18,0.95) 0%, rgba(10,10,18,0.4) 50%, transparent 100%)" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 16 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: "bold", letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD, background: "rgba(255,215,64,0.12)", border: "1px solid rgba(255,215,64,0.3)", padding: "3px 8px", borderRadius: 4, marginBottom: 8 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: GOLD, display: "inline-block" }} />
                    Coming Soon
                  </div>
                  <p style={{ color: "white", fontSize: 15, fontWeight: "bold", lineHeight: 1.2, marginBottom: 4 }}>{game.title}</p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 6 }}>{game.genres?.join(" · ")}</p>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "bold" }}>
                    {game.release_date ? new Date(game.release_date).getFullYear() : "TBA"}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
        <button
          onClick={() => document.getElementById('upcoming-scroll')!.scrollBy({ left: 400, behavior: 'smooth' })}
          style={{ position: "absolute", right: -16, top: "50%", transform: "translateY(-50%)", zIndex: 10, width: 40, height: 40, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
      </div>
    </div>
  </section>
)}
      <section className="px-6 py-10">
        <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-wider">Trending This Week</h2>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => document.getElementById('trending-scroll')!.scrollBy({ left: -400, behavior: 'smooth' })}
            style={{ position: "absolute", left: -16, top: "50%", transform: "translateY(-50%)", zIndex: 10, width: 40, height: 40, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          <div id="trending-scroll" className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
            {trendingGames.map((game, i) => (
              <GameCard key={i} title={game.title} slug={game.slug} buy={game.buy} wait={game.wait} skip={game.skip} cover_url={game.cover_url} />
            ))}
          </div>
          <button
            onClick={() => document.getElementById('trending-scroll')!.scrollBy({ left: 400, behavior: 'smooth' })}
            style={{ position: "absolute", right: -16, top: "50%", transform: "translateY(-50%)", zIndex: 10, width: 40, height: 40, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
        </div>
      </section>

      <section className="px-6 py-10">
        <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-wider">Just Reviewed</h2>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => document.getElementById('recent-scroll')!.scrollBy({ left: -400, behavior: 'smooth' })}
            style={{ position: "absolute", left: -16, top: "50%", transform: "translateY(-50%)", zIndex: 10, width: 40, height: 40, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          <div id="recent-scroll" className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
            {recentGames.map((game, i) => (
              <GameCard key={i} title={game.title} slug={game.slug} buy={game.buy} wait={game.wait} skip={game.skip} cover_url={game.cover_url} />
            ))}
          </div>
          <button
            onClick={() => document.getElementById('recent-scroll')!.scrollBy({ left: 400, behavior: 'smooth' })}
            style={{ position: "absolute", right: -16, top: "50%", transform: "translateY(-50%)", zIndex: 10, width: 40, height: 40, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
        </div>
      </section>

      {!loading && <GenreSection allGames={allGames} />}
    </div>
  );
}
