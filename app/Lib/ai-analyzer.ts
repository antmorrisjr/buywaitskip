// AI Analysis Engine - Analyzes YouTube transcripts using Claude API

interface AnalysisResult {
    verdict: 'BUY' | 'WAIT' | 'SKIP';
    sentimentScore: number;
    pros: string[];
    cons: string[];
    creatorQuote: string;
    isSponsored: boolean;
    sponsorshipConfidence: number;
  }
  
  export async function analyzeTranscript(
    transcript: string,
    videoTitle: string,
    gameTitle: string
  ): Promise<AnalysisResult> {
    
    const prompt = `You are analyzing a YouTube video review transcript for the game "${gameTitle}".
  
  VIDEO TITLE: "${videoTitle}"
  
  TRANSCRIPT:
  ${transcript}
  
  Extract the following and respond ONLY with valid JSON:
  
  {
    "verdict": "BUY" | "WAIT" | "SKIP",
    "sentimentScore": <number from -1 to 1>,
    "pros": [<array of 3-5 positive points>],
    "cons": [<array of 2-4 negative points>],
    "creatorQuote": "<memorable quote, 1-2 sentences>",
    "isSponsored": <true/false>,
    "sponsorshipConfidence": <0 to 1>
  }
  
  VERDICT RULES:
  - BUY: Strongly recommends at full price
  - WAIT: Suggests waiting for sale/patches
  - SKIP: Does not recommend
  
  Return ONLY the JSON, nothing else.`;
  
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
  
    const data = await response.json();
    const textContent = data.content.find((c: any) => c.type === 'text')?.text;
    const result: AnalysisResult = JSON.parse(textContent.trim());
  
    return result;
  }