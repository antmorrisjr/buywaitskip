import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// ─── CLIENTS ────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── YOUTUBE API KEYS (rotating) ────────────────────────────────────────────
const API_KEYS = [
  process.env.YOUTUBE_API_KEY_1,
  process.env.YOUTUBE_API_KEY_2,
  process.env.YOUTUBE_API_KEY_3,
  process.env.YOUTUBE_API_KEY_4,
  process.env.YOUTUBE_API_KEY_5,
  process.env.YOUTUBE_API_KEY_6,
  process.env.YOUTUBE_API_KEY_7,
  process.env.YOUTUBE_API_KEY_8,
  process.env.YOUTUBE_API_KEY_9,
  process.env.YOUTUBE_API_KEY_10,
  process.env.YOUTUBE_API_KEY_11,
  process.env.YOUTUBE_API_KEY_12,
].filter(Boolean);

let currentKeyIndex = 0;
let allKeysExhausted = false;

async function youtubeFetch(url) {
  if (allKeysExhausted) return null;
  url.searchParams.set("key", API_KEYS[currentKeyIndex]);
  const res = await fetch(url.toString());
  if (res.status === 403 || res.status === 429) {
    console.log(`    ⚠️  Key ${currentKeyIndex + 1} exhausted, rotating...`);
    currentKeyIndex++;
    if (currentKeyIndex >= API_KEYS.length) {
      allKeysExhausted = true;
      console.log("    🚫 All API keys exhausted!");
      return null;
    }
    url.searchParams.set("key", API_KEYS[currentKeyIndex]);
    const retry = await fetch(url.toString());
    return retry.json();
  }
  return res.json();
}

// ─── FILTERS ────────────────────────────────────────────────────────────────
function isLikelyReview(title) {
  const t = title.toLowerCase();

  if (t.includes("review")) return true;

  const excludeWords = [
    "walkthrough", "playthrough", "let's play", "lets play",
    "all cutscenes", "ending explained", "speedrun", "challenge",
    "trailer", "reaction", "reacts", "news", "announcement",
    "how to", "guide", "tips", "tricks", "best build",
    "trophy", "achievement", "100%", "all collectibles",
    "easter egg", "dlc", "patch notes", "unboxing",
    "controversy", "drama", "everything we know", "need to know",
    "cannot wait", "can't wait", "hype", "most anticipated",
    "recap", "lore", "explained", "#shorts"
  ];

  if (excludeWords.some(w => t.includes(w))) return false;

  const reviewWords = [
    "worth buying", "should you buy", "honest", "verdict",
    "impressions", "is it good", "is it worth", "buy or skip",
    "before you buy", "i played", "hours in", "hours later",
    "after playing", "is phenomenal", "is amazing", "is terrible",
    "is disappointing", "is incredible", "is mediocre", "is overrated",
    "is underrated", "thoughts on", "my thoughts", "opinion",
    "worth it", "final thoughts", "critique", "analysis"
  ];

  return reviewWords.some(w => t.includes(w));
}

function isEnglish(title) {
  const asciiCount = [...title].filter(c => c.charCodeAt(0) < 128).length;
  return asciiCount / title.length > 0.7;
}

// ─── YOUTUBE SEARCH ──────────────────────────────────────────────────────────
async function searchYouTubeReviews(gameTitle) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", `${gameTitle} review`);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "25");
  url.searchParams.set("order", "relevance");
  url.searchParams.set("relevanceLanguage", "en");
  url.searchParams.set("videoDuration", "medium");

  const data = await youtubeFetch(url);
  if (!data?.items) return [];

  return data.items
    .map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }))
    .filter(v => v.videoId && isEnglish(v.title));
}

// ─── TRANSCRIPT ──────────────────────────────────────────────────────────────
async function fetchTranscript(videoId) {
  try {
    const res = await fetch(
      `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&lang=en`,
      { headers: { "x-api-key": process.env.SUPADATA_API_KEY } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.content) return null;
    const text = Array.isArray(data.content)
      ? data.content.map(s => s.text).join(" ")
      : data.content;
    return text.slice(0, 8000);
  } catch {
    return null;
  }
}

// ─── CLAUDE ANALYSIS ─────────────────────────────────────────────────────────
async function analyzeReview(transcript, videoTitle, gameTitle, channelTitle) {
  const prompt = `You are analyzing a YouTube video review of the game "${gameTitle}".

Video title: "${videoTitle}"
Channel: "${channelTitle}"

Transcript excerpt:
${transcript}

Based on this review, provide:
1. A verdict: BUY, WAIT, or SKIP
2. A confidence score (0-100)
3. A 2-3 sentence summary of the reviewer's opinion
4. Up to 3 pros mentioned
5. Up to 3 cons mentioned
6. Sentiment score (-100 to +100)

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "verdict": "BUY",
  "confidence": 85,
  "summary": "...",
  "pros": ["...", "...", "..."],
  "cons": ["...", "...", "..."],
  "sentiment_score": 75
}`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].text.replace(/```json|```/g, "").trim();
  return JSON.parse(text);
}

// ─── ENSURE CREATOR EXISTS ───────────────────────────────────────────────────
async function ensureCreator(channelId, channelTitle) {
  const { data: existing } = await supabase
    .from("creators")
    .select("id")
    .eq("youtube_channel_id", channelId)
    .single();

  if (existing) return existing.id;

  const { data: newCreator, error } = await supabase
    .from("creators")
    .insert({
      name: channelTitle,
      youtube_channel_id: channelId,
      is_universal: false,
    })
    .select("id")
    .single();

  if (error) {
    console.log(`    ⚠️  Could not add creator: ${channelTitle}`);
    return null;
  }

  console.log(`    ✨ New creator added: ${channelTitle}`);
  return newCreator.id;
}

// ─── PROCESS ONE GAME ────────────────────────────────────────────────────────
async function processGame(game, index, total) {
  console.log(`\n[${index}/${total}] 🎮 ${game.title}`);

  if (allKeysExhausted) {
    console.log("  🚫 Skipping — all API keys exhausted");
    return { saved: 0, skipped: 0, failed: 0 };
  }

  const videos = await searchYouTubeReviews(game.title);
  const likelyReviews = videos.filter(v => isLikelyReview(v.title));
  console.log(`  📹 ${videos.length} found → ${likelyReviews.length} reviews`);

  if (likelyReviews.length === 0) {
    console.log("  ⚠️  No reviews found, skipping");
    return { saved: 0, skipped: 0, failed: 0 };
  }

  let saved = 0, skipped = 0, failed = 0;

  for (const video of likelyReviews) {
    if (allKeysExhausted) break;

    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("youtube_video_id", video.videoId)
      .single();

    if (existing) { skipped++; continue; }

    const transcript = await fetchTranscript(video.videoId);
    if (!transcript) { failed++; continue; }

    try {
      const analysis = await analyzeReview(transcript, video.title, game.title, video.channelTitle);
      const creatorId = await ensureCreator(video.channelId, video.channelTitle);
      if (!creatorId) { failed++; continue; }

      const { error } = await supabase.from("reviews").insert({
        game_id: game.id,
        creator_id: creatorId,
        youtube_video_id: video.videoId,
        video_url: `https://www.youtube.com/watch?v=${video.videoId}`,
        video_title: video.title,
        verdict: analysis.verdict,
        confidence_score: Math.min(100, Math.max(0, Math.round(analysis.confidence))),
        summary: analysis.summary,
        pros: analysis.pros,
        cons: analysis.cons,
        sentiment_score: Math.min(100, Math.max(-100, Math.round(analysis.sentiment_score))),
        published_at: video.publishedAt,
      });

      if (error) {
        console.log(`    ❌ DB error: ${error.message}`);
        failed++;
      } else {
        const emoji = analysis.verdict === "BUY" ? "✅" : analysis.verdict === "WAIT" ? "⏳" : "❌";
        console.log(`    📝 ${video.channelTitle} ${emoji} ${analysis.verdict} (${analysis.confidence}%)`);
        saved++;
      }
    } catch (err) {
      console.log(`    ❌ Failed: ${err.message}`);
      failed++;
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`  ✅ Saved: ${saved} | Skipped: ${skipped} | Failed: ${failed}`);
  return { saved, skipped, failed };
}

// ─── MAIN BATCH ──────────────────────────────────────────────────────────────
async function runBatch() {
  console.log("🚀 BuyWaitSkip — Running full pipeline\n");
  const startTime = Date.now();

  const { data: games, error } = await supabase
    .from("games")
    .select("*")
    .eq("status", "released")
    .order("title");

  if (error || !games?.length) {
    console.log("❌ Could not fetch games:", error?.message);
    return;
  }

  console.log(`📋 ${games.length} released games to process`);

  let totalSaved = 0, totalSkipped = 0, totalFailed = 0;

  for (let i = 0; i < games.length; i++) {
    if (allKeysExhausted) {
      console.log("\n🚫 All API keys exhausted — stopping batch");
      break;
    }

    const result = await processGame(games[i], i + 1, games.length);
    totalSaved += result.saved;
    totalSkipped += result.skipped;
    totalFailed += result.failed;

    await new Promise(r => setTimeout(r, 1000));
  }

  const elapsed = Math.round((Date.now() - startTime) / 60000);
  console.log("\n" + "=".repeat(50));
  console.log(`✅ Batch complete in ${elapsed} minutes`);
  console.log(`   Total saved:   ${totalSaved}`);
  console.log(`   Total skipped: ${totalSkipped}`);
  console.log(`   Total failed:  ${totalFailed}`);
  console.log(`   Final API key: ${currentKeyIndex + 1}/${API_KEYS.length}`);
  console.log("=".repeat(50));
}

runBatch().catch(console.error);