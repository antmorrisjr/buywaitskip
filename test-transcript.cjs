const https = require('https');

const videoId = 'dQw4w9WgXcQ';

https.get('https://www.youtube.com/watch?v=' + videoId, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/"captionTracks":\[(.*?)\]/);
    if (match) {
      console.log('FOUND captions!');
      console.log(match[0].substring(0, 300));
    } else {
      console.log('NO captions found in page');
      console.log('Page length:', data.length);
    }
  });
}).on('error', e => console.log('ERROR:', e.message));
