require('dotenv').config({ path: '.env.local' });

console.log('Script starting...');

async function getCaptionViaAPI(videoId) {
  console.log('Fetching captions for:', videoId);
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`
  );
  const data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

getCaptionViaAPI('dQw4w9WgXcQ').catch(e => console.error('ERROR:', e));

