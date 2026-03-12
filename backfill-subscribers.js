// backfill-subscribers.js
// Fetches subscriber counts for all creators with null subscriber_count
// Uses YouTube Data API v3 (batch requests of 50 channel IDs at a time)
// Run: node backfill-subscribers.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Use your rotating API keys — add as many as you have
const API_KEYS = [
  process.env.YOUTUBE_API_KEY,
  process.env.YOUTUBE_API_KEY_2,
  process.env.YOUTUBE_API_KEY_3,
].filter(Boolean);

let keyIndex = 0;
function getNextKey() {
  const key = API_KEYS[keyIndex % API_KEYS.length];
  keyIndex++;
  return key;
}

function formatSubs(count) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return count.toString();
}

async function fetchSubscriberCounts(channelIds) {
  const apiKey = getNextKey();
  const ids = channelIds.join(',');
  const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${ids}&key=${apiKey}`;
  
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`YouTube API error: ${err.error?.message || res.status}`);
  }
  
  const data = await res.json();
  const result = {};
  for (const item of (data.items || [])) {
    const subs = parseInt(item.statistics?.subscriberCount || '0', 10);
    result[item.id] = subs;
  }
  return result;
}

async function main() {
  console.log('🔍 Fetching creators with null subscriber counts...');
  
  const { data: creators, error } = await supabase
    .from('creators')
    .select('id, name, youtube_channel_id, subscriber_count')
    .is('subscriber_count', null)
    .not('youtube_channel_id', 'like', 'INVALID_%');
  
  if (error) {
    console.error('Supabase error:', error);
    process.exit(1);
  }
  
  console.log(`Found ${creators.length} creators to update\n`);
  
  // Batch into groups of 50 (YouTube API limit)
  const BATCH_SIZE = 50;
  let updated = 0;
  let failed = 0;
  let notFound = 0;
  
  for (let i = 0; i < creators.length; i += BATCH_SIZE) {
    const batch = creators.slice(i, i + BATCH_SIZE);
    const channelIds = batch.map(c => c.youtube_channel_id);
    
    console.log(`\nBatch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(creators.length/BATCH_SIZE)}: fetching ${batch.length} channels...`);
    
    let subCounts;
    try {
      subCounts = await fetchSubscriberCounts(channelIds);
    } catch (err) {
      console.error(`  ❌ API error on batch: ${err.message}`);
      failed += batch.length;
      // Small delay before trying next batch
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }
    
    // Update each creator
    for (const creator of batch) {
      const count = subCounts[creator.youtube_channel_id];
      
      if (count === undefined) {
        console.log(`  ⚠️  Not found: ${creator.name} (${creator.youtube_channel_id})`);
        notFound++;
        // Set to 0 so we don't keep retrying dead channels
        await supabase
          .from('creators')
          .update({ subscriber_count: 0 })
          .eq('id', creator.id);
        continue;
      }
      
      const { error: updateError } = await supabase
        .from('creators')
        .update({ subscriber_count: count })
        .eq('id', creator.id);
      
      if (updateError) {
        console.error(`  ❌ DB error for ${creator.name}: ${updateError.message}`);
        failed++;
      } else {
        console.log(`  ✅ ${creator.name}: ${formatSubs(count)}`);
        updated++;
      }
    }
    
    // Respect rate limits — 100ms between batches
    if (i + BATCH_SIZE < creators.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  
  console.log('\n========================================');
  console.log(`✅ Updated: ${updated}`);
  console.log(`⚠️  Not found (set to 0): ${notFound}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('========================================');
  console.log('\nDone! Subscriber counts backfilled.');
}

main().catch(console.error);
