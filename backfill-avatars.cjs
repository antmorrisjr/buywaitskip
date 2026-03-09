process.on('unhandledRejection', (err) => { console.error('UNHANDLED:', err); });

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

console.log("Starting...");
console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ found" : "❌ missing");
console.log("Service key:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ found" : "❌ missing");
console.log("YT API key:", process.env.YOUTUBE_API_KEY_1 ? "✅ found" : "❌ missing");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const YT_API_KEY = process.env.YOUTUBE_API_KEY_1;

async function resolveHandle(handle) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=${handle.replace("@","")}&key=${YT_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;
  return {
    channelId: item.id,
    avatar: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
  };
}

async function fetchAvatarsByIds(channelIds) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelIds.join(",")}&key=${YT_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.items) return {};
  const map = {};
  for (const item of data.items) {
    map[item.id] = item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url;
  }
  return map;
}

async function main() {
  console.log("\nQuerying Supabase...");
  const { data: creators, error } = await supabase
    .from("creators")
    .select("id, name, youtube_channel_id")
    .or("avatar_url.is.null,avatar_url.eq.''");

  if (error) { console.error("Supabase error:", error); return; }
  if (!creators?.length) { console.log("No missing avatars!"); return; }
  console.log(`Found ${creators.length} creators missing avatars\n`);

  const handles = creators.filter(c => c.youtube_channel_id?.startsWith("@"));
  const realIds = creators.filter(c => c.youtube_channel_id?.startsWith("UC"));

  console.log(`  ${realIds.length} have UC channel IDs`);
  console.log(`  ${handles.length} have @handles to resolve\n`);

  let updated = 0;

  // Process real UC IDs in batches of 50
  for (let i = 0; i < realIds.length; i += 50) {
    const batch = realIds.slice(i, i + 50);
    const ids = batch.map(c => c.youtube_channel_id);
    const avatarMap = await fetchAvatarsByIds(ids);
    for (const creator of batch) {
      const avatar = avatarMap[creator.youtube_channel_id];
      if (avatar) {
        await supabase.from("creators").update({ avatar_url: avatar }).eq("id", creator.id);
        console.log(`✅ ${creator.name}`);
        updated++;
      } else {
        console.log(`⚠️  ${creator.name}: not found`);
      }
    }
    await new Promise(r => setTimeout(r, 300));
  }

  // Process @handles one at a time
  console.log(`\nResolving ${handles.length} @handles...`);
  for (const creator of handles) {
    process.stdout.write(`  ${creator.name}... `);
    try {
      const result = await resolveHandle(creator.youtube_channel_id);
      if (result) {
        await supabase.from("creators").update({ 
          avatar_url: result.avatar,
          youtube_channel_id: result.channelId
        }).eq("id", creator.id);
        console.log(`✅`);
        updated++;
      } else {
        console.log(`⚠️  not found`);
      }
    } catch(e) {
      console.log(`❌ error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nDone! Updated ${updated} avatars.`);
}

main().catch(console.error);
