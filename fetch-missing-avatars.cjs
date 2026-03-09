const { createClient } = require("@supabase/supabase-js");
const https = require("https");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY_1;

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

async function fetchChannelBatch(channelIds) {
  const ids = channelIds.join(",");
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${ids}&key=${YOUTUBE_API_KEY}`;
  const data = await fetchJSON(url);
  return data.items || [];
}

async function main() {
  console.log("🚀 Fetching avatars for creators missing them...\n");

  const { data: creators, error } = await supabase
    .from("creators")
    .select("id, name, youtube_channel_id")
    .is("avatar_url", null)
    .not("youtube_channel_id", "is", null);

  if (error) { console.error("DB error:", error); return; }
  console.log(`Found ${creators.length} creators without avatars\n`);

  // YouTube allows up to 50 channel IDs per request — massive quota savings!
  // 50 channels = 1 API call = 1 unit (not 100!) since it's a channels.list not search
  const BATCH_SIZE = 50;
  let updated = 0;
  let failed = 0;
  let batchNum = 0;

  for (let i = 0; i < creators.length; i += BATCH_SIZE) {
    const batch = creators.slice(i, i + BATCH_SIZE);
    batchNum++;
    console.log(`📡 Batch ${batchNum}: fetching ${batch.length} channels...`);

    try {
      const channelIds = batch.map(c => c.youtube_channel_id);
      const items = await fetchChannelBatch(channelIds);

      // Map results back to creators
      const resultsMap = {};
      for (const item of items) {
        resultsMap[item.id] = {
          avatarUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
          subscriberCount: parseInt(item.statistics?.subscriberCount || "0"),
          name: item.snippet.title,
        };
      }

      // Update each creator
      for (const creator of batch) {
        const result = resultsMap[creator.youtube_channel_id];
        if (result && result.avatarUrl) {
          const { error: updateError } = await supabase
            .from("creators")
            .update({
              avatar_url: result.avatarUrl,
              subscriber_count: result.subscriberCount,
            })
            .eq("id", creator.id);

          if (updateError) {
            console.log(`  ⚠️  ${creator.name}: ${updateError.message}`);
            failed++;
          } else {
            console.log(`  ✅ ${creator.name} | ${(result.subscriberCount / 1000).toFixed(0)}K subs`);
            updated++;
          }
        } else {
          console.log(`  ❌ ${creator.name}: not found on YouTube`);
          failed++;
        }
      }
    } catch (e) {
      console.log(`  ❌ Batch error: ${e.message}`);
      failed += batch.length;
    }

    // Small delay between batches
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n✅ Done!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Failed/Not found: ${failed}`);
  console.log(`   API units used: ~${batchNum} (very efficient!)`);
}

main().catch(console.error);
