const { createClient } = require("@supabase/supabase-js");
const https = require("https");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

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

async function searchChannelByHandle(handle) {
  // Strip @ if present
  const cleanHandle = handle.replace("@", "");
  
  // Try direct handle lookup first
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${cleanHandle}&key=${YOUTUBE_API_KEY}`;
  const data = await fetchJSON(url);
  
  if (data.items && data.items.length > 0) {
    const ch = data.items[0];
    return {
      channelId: ch.id,
      avatarUrl: ch.snippet.thumbnails?.high?.url || ch.snippet.thumbnails?.default?.url,
      subscriberCount: parseInt(ch.statistics?.subscriberCount || "0"),
      name: ch.snippet.title,
    };
  }
  
  // Fallback: search by name
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(cleanHandle)}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`;
  const searchData = await fetchJSON(searchUrl);
  
  if (searchData.items && searchData.items.length > 0) {
    const channelId = searchData.items[0].snippet.channelId;
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`;
    const channelData = await fetchJSON(channelUrl);
    
    if (channelData.items && channelData.items.length > 0) {
      const ch = channelData.items[0];
      return {
        channelId: ch.id,
        avatarUrl: ch.snippet.thumbnails?.high?.url || ch.snippet.thumbnails?.default?.url,
        subscriberCount: parseInt(ch.statistics?.subscriberCount || "0"),
        name: ch.snippet.title,
      };
    }
  }
  
  return null;
}

async function main() {
  console.log("🚀 Fetching channel IDs for creators missing them...\n");
  
  // Get creators without channel IDs
  const { data: creators, error } = await supabase
    .from("creators")
    .select("id, name, handle, youtube_channel_id, avatar_url")
    .is("youtube_channel_id", null)
    .not("handle", "is", null)
    .order("name");
  
  if (error) { console.error("DB error:", error); return; }
  
  console.log(`Found ${creators.length} creators without channel IDs\n`);
  
  let updated = 0;
  let failed = 0;
  let apiCalls = 0;
  
  for (const creator of creators) {
    // Stop before hitting quota (each lookup = ~100-200 units, we have 10000/day)
    if (apiCalls >= 40) {
      console.log(`\n⚠️  Stopping at 40 API calls to preserve quota. Run again tomorrow for more!`);
      break;
    }
    
    console.log(`🔍 ${creator.name} (${creator.handle})`);
    
    try {
      const result = await searchChannelByHandle(creator.handle);
      apiCalls += 2; // handle lookup + possible search
      
      if (result) {
        const updateData = {
          youtube_channel_id: result.channelId,
          subscriber_count: result.subscriberCount,
        };
        
        // Only update avatar if they don't have one
        if (!creator.avatar_url && result.avatarUrl) {
          updateData.avatar_url = result.avatarUrl;
        }
        
        const { error: updateError } = await supabase
          .from("creators")
          .update(updateData)
          .eq("id", creator.id);
        
        if (updateError) {
          // Might be duplicate channel ID - skip
          console.log(`  ⚠️  Skipped (duplicate channel ID likely)`);
          failed++;
        } else {
          console.log(`  ✅ ${result.name} | ${(result.subscriberCount/1000).toFixed(0)}K subs | ${result.channelId}`);
          updated++;
        }
      } else {
        console.log(`  ❌ Not found`);
        failed++;
      }
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}`);
      failed++;
    }
    
    // Delay to avoid rate limits
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\n✅ Done!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Failed/Skipped: ${failed}`);
  console.log(`   API calls used: ~${apiCalls * 100} units`);
  console.log(`\nRun again tomorrow to get more creators!`);
}

main().catch(console.error);
