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

  // Instant pass — title explicitly says review
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
  // Run multiple searches with different queries to find more reviews
  const queries = [
    `${gameTitle} review`,
    `${gameTitle} honest review`,
    `${gameTitle} is it worth it`,
  ];

  const seen = new Set();
  const allVideos = [];

  for (const q of queries) {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", q);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "25");
    url.searchParams.set("order", "relevance");
    url.searchParams.set("relevanceLanguage", "en");
    url.searchParams.set("videoDuration", "medium");

    const data = await youtubeFetch(url);
    if (!data?.items) continue;

    for (const item of data.items) {
      const videoId = item.id.videoId;
      if (!videoId || seen.has(videoId)) continue;
      seen.add(videoId);
      allVideos.push({
        videoId,
        title: item.snippet.title,
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
      });
    }

    // Small delay between searches
    await new Promise(r => setTimeout(r, 300));
  }

  return allVideos.filter(v => v.videoId && isEnglish(v.title));
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

// ─── MAIN PIPELINE ───────────────────────────────────────────────────────────
async function runPipeline(gameTitle) {
  console.log(`\n🎮 Processing: ${gameTitle}`);

  // Get game from DB
  const { data: game } = await supabase
    .from("games")
    .select("*")
    .ilike("title", gameTitle)
    .single();

  if (!game) {
    console.log(`  ❌ Game not found in database: ${gameTitle}`);
    return;
  }

  console.log(`  ✅ Found: ${game.title}`);

  // Search YouTube
  console.log(`  🔍 Searching YouTube for "${gameTitle} review"...`);
  const videos = await searchYouTubeReviews(gameTitle);
  console.log(`  📹 ${videos.length} videos found`);

  if (allKeysExhausted) return;

  // Filter to reviews
  const likelyReviews = videos.filter(v => isLikelyReview(v.title));
  console.log(`  ✅ ${likelyReviews.length} passed review filter\n`);

  if (likelyReviews.length === 0) {
    console.log("  ⚠️  No reviews found!");
    return;
  }

  // Process each review
  let saved = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`  🤖 Analyzing reviews...`);

  for (const video of likelyReviews) {
    if (allKeysExhausted) break;

    // Check duplicate by video ID
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("youtube_video_id", video.videoId)
      .single();

    if (existing) {
      console.log(`    📝 ${video.channelTitle} — "${video.title.slice(0, 50)}..." ⏭️  already exists`);
      skipped++;
      continue;
    }

    // Check duplicate by creator + game (same creator can't review same game twice)
    const creatorIdCheck = await ensureCreator(video.channelId, video.channelTitle);
    if (creatorIdCheck) {
      const { data: creatorExisting } = await supabase
        .from("reviews")
        .select("id")
        .eq("game_id", game.id)
        .eq("creator_id", creatorIdCheck)
        .single();

      if (creatorExisting) {
        console.log(`    📝 ${video.channelTitle} — "${video.title.slice(0, 50)}..." ⏭️  creator already reviewed`);
        skipped++;
        continue;
      }
    }

    // Fetch transcript
    const transcript = await fetchTranscript(video.videoId);
    if (!transcript) {
      console.log(`    📝 ${video.channelTitle} — no transcript, skipping`);
      failed++;
      continue;
    }

    // Analyze
    try {
      const analysis = await analyzeReview(transcript, video.title, game.title, video.channelTitle);
      const creatorId = creatorIdCheck || await ensureCreator(video.channelId, video.channelTitle);
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
        console.log(`    📝 ${video.channelTitle} — "${video.title.slice(0, 50)}..." ${emoji} ${analysis.verdict} (${analysis.confidence}%)`);
        saved++;
      }
    } catch (err) {
      console.log(`    ❌ Failed for ${video.channelTitle}: ${err.message}`);
      failed++;
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n  ✅ Done!`);
  console.log(`     Saved: ${saved} new reviews`);
  console.log(`     Skipped/exists: ${skipped}`);
  console.log(`     Failed: ${failed}`);
  console.log(`     API key: ${currentKeyIndex + 1}/${API_KEYS.length}`);
}

// ─── RUN ─────────────────────────────────────────────────────────────────────
const gameTitle = process.argv[2];
if (!gameTitle) {
  console.log('Usage: node enhanced-pipeline.js "Game Title"');
  process.exit(1);
}

runPipeline(gameTitle).catch(console.error);