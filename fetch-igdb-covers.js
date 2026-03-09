import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── GET IGDB ACCESS TOKEN ────────────────────────────────────────
async function getAccessToken() {
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" }
  );
  const data = await res.json();
  return data.access_token;
}

// ─── FETCH GAME FROM IGDB ─────────────────────────────────────────
async function fetchIGDBGame(title, accessToken) {
  const res = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": process.env.IGDB_CLIENT_ID,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body: `search "${title}"; fields name, cover.image_id, screenshots.image_id, summary, first_release_date, involved_companies.company.name, involved_companies.developer, involved_companies.publisher, platforms.name; limit 1;`,
  });
  const data = await res.json();
  return data?.[0] || null;
}

// ─── BUILD IMAGE URL ──────────────────────────────────────────────
function buildCoverUrl(imageId) {
  return `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`;
}

function buildBannerUrl(imageId) {
  return `https://images.igdb.com/igdb/image/upload/t_screenshot_big/${imageId}.jpg`;
}

// ─── MAIN ─────────────────────────────────────────────────────────
async function run() {
  console.log("🎮 Fetching IGDB covers for all games...\n");

  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.log("❌ Failed to get IGDB access token!");
    return;
  }
  console.log("✅ Got IGDB access token\n");

  const { data: games } = await supabase
    .from("games")
    .select("id, title, cover_url")
    .order("title");

  if (!games || games.length === 0) {
    console.log("No games found!");
    return;
  }

  console.log(`Found ${games.length} games to process\n`);

  let updated = 0;
  let failed = 0;

  for (const game of games) {
    process.stdout.write(`  🔍 ${game.title}... `);

    try {
      const igdbGame = await fetchIGDBGame(game.title, accessToken);

      if (!igdbGame) {
        console.log("❌ not found on IGDB");
        failed++;
        continue;
      }

      const coverUrl = igdbGame.cover?.image_id
        ? buildCoverUrl(igdbGame.cover.image_id)
        : null;

      const bannerUrl = igdbGame.screenshots?.[0]?.image_id
        ? buildBannerUrl(igdbGame.screenshots[0].image_id)
        : null;

      // Get developer and publisher
      const developer = igdbGame.involved_companies?.find(c => c.developer)?.company?.name || null;
      const publisher = igdbGame.involved_companies?.find(c => c.publisher)?.company?.name || null;

      // Get release date
      const releaseDate = igdbGame.first_release_date
        ? new Date(igdbGame.first_release_date * 1000).toISOString().split("T")[0]
        : null;

      // Get description
      const description = igdbGame.summary || null;

      const { error } = await supabase
        .from("games")
        .update({
          cover_url: coverUrl,
          banner_url: bannerUrl,
          developer,
          publisher,
          release_date: releaseDate,
          description,
          igdb_id: igdbGame.id,
        })
        .eq("id", game.id);

      if (error) {
        console.log(`❌ save error: ${error.message}`);
        failed++;
      } else {
        console.log(`✅ ${coverUrl ? "cover saved" : "no cover"}`);
        updated++;
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 250));

    } catch (e) {
      console.log(`❌ error: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Failed: ${failed}`);
}

run().catch(console.error);
