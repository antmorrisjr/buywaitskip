import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── CLI ARGS ─────────────────────────────────────────────────────────────────
// Usage: node add-manual-reviews.js "Game Title" https://youtube.com/watch?v=XXX ...
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node add-manual-reviews.js "Game Title" <youtube_url> [<youtube_url> ...]');
  process.exit(1);
}

const GAME_TITLE = args[0];
const URLs = args.slice(1);

function extractVideoId(url) {
  try {
    const u = new URL(url);
    return u.searchParams.get("v") || u.pathname.split("/").pop();
  } catch {
    return url; // assume it's already a video ID
  }
}

// ─── YOUTUBE ──────────────────────────────────────────────────────────────────
async function getVideoInfo(videoId) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY_1}`
    );
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;
    return {
      title: item.snippet.title,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      avatarUrl: null,
    };
  } catch {
    return null;
  }
}

async function getChannelAvatar(channelId) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${process.env.YOUTUBE_API_KEY_1}`
    );
    const data = await res.json();
    return data.items?.[0]?.snippet?.thumbnails?.medium?.url || null;
  } catch {
    return null;
  }
}

// ─── TRANSCRIPT ───────────────────────────────────────────────────────────────
async function getTranscript(videoId) {
  try {
    const res = await fetch(
      `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`,
      { headers: { "x-api-key": process.env.SUPADATA_API_KEY } }
    );
    const data = await res.json();
    return data.content || null;
  } catch {
    return null;
  }
}

// ─── CLAUDE ANALYSIS ──────────────────────────────────────────────────────────
async function analyzeWithClaude(transcript, videoTitle) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        messages: [{
          role: "user",
          content: `You are analyzing a YouTube review of "${GAME_TITLE}".
Video title: "${videoTitle}"
Transcript (first 6000 chars): ${transcript?.slice(0, 6000) || "No transcript available"}

Respond with ONLY a valid JSON object (no markdown, no backticks):
{
  "verdict": "BUY" or "WAIT" or "SKIP",
  "confidence": 0 to 100,
  "summary": "2-3 sentences capturing the reviewer's overall opinion and key points",
  "is_sponsored": true or false
}`,
        }],
      }),
    });
    const data = await res.json();
    const text = data.content?.[0]?.text || "";
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

// ─── ENSURE CREATOR ───────────────────────────────────────────────────────────
async function ensureCreator(channelId, channelTitle) {
  // Check by channel ID first
  const { data: existing } = await supabase
    .from("creators")
    .select("id, name")
    .eq("youtube_channel_id", channelId)
    .maybeSingle();

  if (existing) return existing;

  // Try by name
  const { data: byName } = await supabase
    .from("creators")
    .select("id, name")
    .ilike("name", channelTitle)
    .maybeSingle();

  if (byName) {
    // Update channel ID if missing
    await supabase.from("creators").update({ youtube_channel_id: channelId }).eq("id", byName.id);
    return byName;
  }

  // Create new creator
  const avatar = await getChannelAvatar(channelId);
  const { data: newCreator, error } = await supabase
    .from("creators")
    .insert({ name: channelTitle, youtube_channel_id: channelId, avatar_url: avatar, is_media: false })
    .select("id, name")
    .single();

  if (error) return null;
  console.log(`    ✨ New creator added: ${channelTitle}`);
  return newCreator;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log(`\n🎮 Adding manual reviews for: ${GAME_TITLE}`);
  console.log(`📋 ${URLs.length} URL(s) to process\n`);

  const { data: game } = await supabase
    .from("games")
    .select("id, title")
    .ilike("title", `%${GAME_TITLE}%`)
    .maybeSingle();

  if (!game) {
    console.log(`❌ Game not found: "${GAME_TITLE}"`);
    process.exit(1);
  }
  console.log(`✅ Found game: ${game.title}\n`);

  let saved = 0;
  let skipped = 0;
  let failed = 0;

  for (const url of URLs) {
    const videoId = extractVideoId(url);
    process.stdout.write(`📝 Processing ${videoId}... `);

    // Check if video already exists
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("youtube_video_id", videoId)
      .maybeSingle();

    if (existing) { console.log("⏭️  already exists"); skipped++; continue; }

    // Get video info from YouTube
    const info = await getVideoInfo(videoId);
    if (!info) { console.log("❌ video not found on YouTube"); failed++; continue; }

    process.stdout.write(`\n    "${info.title}" by ${info.channelTitle}\n    `);

    // Ensure creator exists
    const creator = await ensureCreator(info.channelId, info.channelTitle);
    if (!creator) { console.log("❌ could not create creator"); failed++; continue; }

    // Check one review per creator per game
    const { data: creatorExisting } = await supabase
      .from("reviews")
      .select("id")
      .eq("game_id", game.id)
      .eq("creator_id", creator.id)
      .maybeSingle();

    if (creatorExisting) { console.log(`⏭️  ${creator.name} already reviewed this game`); skipped++; continue; }

    // Get transcript
    process.stdout.write("📄 Fetching transcript... ");
    const transcript = await getTranscript(videoId);
    if (!transcript) { console.log("❌ no transcript available"); failed++; continue; }

    // Analyze with Claude
    process.stdout.write("🤖 Analyzing... ");
    const analysis = await analyzeWithClaude(transcript, info.title);
    if (!analysis) { console.log("❌ analysis failed"); failed++; continue; }

    // Save to DB
    const { error } = await supabase.from("reviews").insert({
      game_id: game.id,
      creator_id: creator.id,
      youtube_video_id: videoId,
      verdict: analysis.verdict,
      summary: analysis.summary,
      confidence_score: analysis.confidence,
      is_sponsored: analysis.is_sponsored || false,
      video_url: `https://youtube.com/watch?v=${videoId}`,
      video_title: info.title,
      published_at: info.publishedAt,
    });

    if (error) {
      console.log(`❌ save error: ${error.message}`);
      failed++;
    } else {
      console.log(`✅ ${analysis.verdict} (${analysis.confidence}% confidence)`);
      saved++;
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅ Saved: ${saved} | ⏭️  Skipped: ${skipped} | ❌ Failed: ${failed}`);
}

run().catch(console.error);