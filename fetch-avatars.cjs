const https = require('https');

const API_KEY = 'AIzaSyCJDjZ4cKikYTRtqX0oDVdt0AyNHfRHa2o';

const creators = [
    { name: 'Easy Allies', channelId: 'UCyNDZKMBNxQbIgnSVoJbLdg' },
    { name: 'Push Square', channelId: 'UCbI-X9F07inmxYvQKDB0U7Q' },
  ];

function fetchChannels(ids) {
  return new Promise((resolve, reject) => {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${ids.join(',')}&key=${API_KEY}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  const ids = creators.map(c => c.channelId);
  const result = await fetchChannels(ids);

  if (result.error) {
    console.error('API Error:', result.error);
    return;
  }

  const sql = [];
  for (const item of result.items) {
    const creator = creators.find(c => c.channelId === item.id);
    if (!creator) continue;
    const avatar = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url;
    const subs = parseInt(item.statistics.subscriberCount || 0);
    const handle = item.snippet.customUrl || '';
    sql.push(`UPDATE creators SET avatar_url = '${avatar}', subscriber_count = ${subs}, handle = '${handle}' WHERE name = '${creator.name}';`);
    console.log(`✅ ${creator.name}: ${subs} subs`);
  }

  console.log('\n--- SQL TO RUN IN SUPABASE ---\n');
  console.log(sql.join('\n'));
}

main();
