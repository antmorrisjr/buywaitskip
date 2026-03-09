const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function testClaude() {
  console.log('Testing Claude API...');
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('ERROR: ANTHROPIC_API_KEY not found');
    return;
  }
  
  console.log('API Key found!');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Say hello in one sentence!',
          },
        ],
      }),
    });

    const data = await response.json();
    
    console.log('\nFull response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.content && data.content[0]) {
      console.log('\n✅ Claude says:', data.content[0].text);
    } else if (data.error) {
      console.log('\n❌ Error from Claude:', data.error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testClaude();