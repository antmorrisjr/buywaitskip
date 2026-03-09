import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// ─── STEP 1: BUILD QUERY VARIATIONS ─────────────────────────────
function buildSearchQueries(gameTitle) {
  return [
    `${gameTitle} review`,
    `${gameTitle} worth buying`,
    `${gameTitle} honest review`,
    `should I buy ${gameTitle}`,
    `${gameTitle} first impressions`,
    `${gameTitle} is it good`,
    `${gameTitle} gameplay review`,
    `${gameTitle} impressions 2025`,
  ];
}

// ─── STEP 2: YOUTUBE SEARCH ──────────────────────────────────────
async function searchYouTube(query, maxResults = 10) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("videoDuration", "medium");
  url.searchParams.set("maxResults", maxResults);
  url.searchParams.set("key", YOUTUBE_API_KEY);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (!data.items) return [];

  return data.items.map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelId: item.snippet.channelId,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    fromCreatorDB: false,
  }));
}

// ─── STEP 3: CREATOR CHANNEL SEARCH ─────────────────────────────
async function searchCreatorChannel(channelId, gameTitle) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", gameTitle);
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", 3);
  url.searchParams.set("key", YOUTUBE_API_KEY);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (!data.items) return [];

  return data.items.map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelId: item.snippet.channelId,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    fromCreatorDB: true,
  }));
}

// ─── STEP 4: DEDUPLICATE ─────────────────────────────────────────
function deduplicate(videos) {
  const seen = new Set();
  return videos.filter((v) => {
    if (seen.has(v.videoId)) return false;
    seen.add(v.videoId);
    return true;
  });
}

// ─── STEP 5: FETCH TRANSCRIPT ────────────────────────────────────
async function fetchTranscript(videoId) {
    try {
      const res = await fetch(
        `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`,
        { headers: { "x-api-key": process.env.SUPADATA_API_KEY } }
      );
      const data = await res.json();
      if (!data.content) return null;
      const text = typeof data.content === "string"
        ? data.content
        : data.content.map((c) => c.text).join(" ");
      // Reject if too short to be a real review
      return text.length < 500 ? null : text;
    } catch (err) {
      return null;
    }
  }
// ─── STEP 6: ANALYZE WITH CLAUDE ────────────────────────────────
async function analyzeTranscript(transcript, gameTitle, creatorName) {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are analyzing a YouTube video review from "${creatorName}" reviewing "${gameTitle}".

Review content:
${transcript.slice(0, 6000)}

Respond with only valid JSON:
{
  "verdict": "BUY" or "WAIT" or "SKIP",
  "sentiment_score": decimal 0.00-1.00,
  "pros": ["pro1", "pro2", "pro3"],
  "cons": ["con1", "con2", "con3"],
  "creator_quote": "one compelling 1-2 sentence quote",
  "sponsored": true or false
}`,
      },
    ],
  });

  const raw = message.content[0].text;
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

// ─── STEP 7: SAVE TO SUPABASE ────────────────────────────────────
async function saveReview(gameId, video, analysis) {
  // Find or create creator
  let { data: creator } = await supabase
    .from("creators")
    .select("*")
    .eq("youtube_channel_id", video.channelId)
    .single();

  if (!creator) {
    const { data: newCreator, error } = await supabase
      .from("creators")
      .insert({
        name: video.channelTitle,
        youtube_channel_id: video.channelId,
        is_trusted: video.fromCreatorDB,
      })
      .select()
      .single();

    if (error) {
      console.log(`    ⚠️  Could not save creator: ${error.message}`);
      return false;
    }
    creator = newCreator;
  }

  // Check if review already exists
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("youtube_video_id", video.videoId)
    .single();

  if (existing) {
    console.log(`    ⏭️  Already processed: ${video.title.slice(0, 50)}`);
    return false;
  }

  const { error } = await supabase.from("reviews").insert({
    game_id: gameId,
    creator_id: creator.id,
    youtube_video_id: video.videoId,
    video_url: `https://youtube.com/watch?v=${video.videoId}`,
    verdict: analysis.verdict,
    sentiment_score: analysis.sentiment_score,
    pros: analysis.pros,
    cons: analysis.cons,
    creator_quote: analysis.creator_quote,
    is_sponsored: analysis.sponsored,
  });

  if (error) {
    console.log(`    ❌ Save error: ${error.message}`);
    return false;
  }
  return true;
}

// ─── STEP 8: CALCULATE + UPDATE VERDICTS ─────────────────────────
async function updateVerdicts(gameId, gameTitle) {
  const { data: reviews } = await supabase
    .from("reviews")
    .select("verdict, sentiment_score")
    .eq("game_id", gameId);

  if (!reviews || reviews.length === 0) return;

  const counts = { BUY: 0, WAIT: 0, SKIP: 0 };
  reviews.forEach((r) => counts[r.verdict]++);
  const total = reviews.length;

  const buyPct  = Math.round((counts.BUY  / total) * 100);
  const waitPct = Math.round((counts.WAIT / total) * 100);
  const skipPct = Math.round((counts.SKIP / total) * 100);

  const confidence =
    total >= 15 ? "high" : total >= 8 ? "medium" : "low";

  await supabase
    .from("games")
    .update({
      buy_percentage:  buyPct,
      wait_percentage: waitPct,
      skip_percentage: skipPct,
      confidence_level: confidence,
      total_reviews: total,
    })
    .eq("id", gameId);

  console.log(`\n  📊 Final Verdict for ${gameTitle}:`);
  console.log(`     BUY: ${buyPct}%  WAIT: ${waitPct}%  SKIP: ${skipPct}%`);
  console.log(`     Confidence: ${confidence.toUpperCase()} (${total} reviews)`);
}

// ─── MAIN ────────────────────────────────────────────────────────
async function processGame(gameTitle, maxReviews = 15) {
  console.log(`\n🎮 Processing: ${gameTitle}`);

  // Find game in DB
  const { data: game } = await supabase
    .from("games")
    .select("*")
    .ilike("title", `%${gameTitle}%`)
    .single();

  if (!game) {
    console.log(`❌ Game not found in DB: ${gameTitle}`);
    console.log(`   Add it to Supabase first, then re-run.`);
    return;
  }

  console.log(`  ✅ Found game: ${game.title} (id: ${game.id})`);

  // Find all videos
  let allVideos = [];

  console.log("  📡 Running query variations...");
  for (const query of buildSearchQueries(gameTitle)) {
    const results = await searchYouTube(query, 8);
    allVideos.push(...results);
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log("  👥 Searching creator channels...");
  const { data: creators } = await supabase
    .from("creators")
    .select("youtube_channel_id, name");

  for (const creator of creators || []) {
    const results = await searchCreatorChannel(creator.youtube_channel_id, gameTitle);
    if (results.length > 0) {
      console.log(`    ✅ ${creator.name}: ${results.length} found`);
    }
    allVideos.push(...results);
    await new Promise((r) => setTimeout(r, 250));
  }

  const unique = deduplicate(allVideos);
  // Prioritize creator DB videos first
  const prioritized = [
    ...unique.filter((v) => v.fromCreatorDB),
    ...unique.filter((v) => !v.fromCreatorDB),
  ].slice(0, maxReviews);

  console.log(`\n  🎯 Processing ${prioritized.length} videos (from ${unique.length} found)`);

  // Process each video
  let saved = 0;
  let failed = 0;

  for (const video of prioritized) {
    console.log(`\n  🎬 ${video.channelTitle}: ${video.title.slice(0, 60)}`);

    try {
      const transcript = await fetchTranscript(video.videoId);
      if (!transcript || transcript.length < 200) {
        console.log(`    ⚠️  No transcript available`);
        failed++;
        continue;
      }

      const analysis = await analyzeTranscript(transcript, gameTitle, video.channelTitle);
      console.log(`    verdict: ${analysis.verdict} | sentiment: ${analysis.sentiment_score} | sponsored: ${analysis.sponsored}`);

      const wasSaved = await saveReview(game.id, video, analysis);
      if (wasSaved) saved++;

      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.log(`    ❌ Error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n  ✅ Saved: ${saved} | ⚠️  Failed/Skipped: ${failed}`);
  await updateVerdicts(game.id, game.title);
}

// ─── RUN ─────────────────────────────────────────────────────────
const gameTitle = process.argv[2] || "Resident Evil 9";
const maxReviews = parseInt(process.argv[3]) || 15;
processGame(gameTitle, maxReviews).catch(console.error);