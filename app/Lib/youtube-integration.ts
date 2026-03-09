// YouTube Integration - Search for reviews and get transcripts

interface YouTubeVideo {
    videoId: string;
    title: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
  }
  
  export async function searchGameReviews(
    gameTitle: string,
    maxResults: number = 50
  ): Promise<YouTubeVideo[]> {
    
    const query = `${gameTitle} review`;
    const apiKey = process.env.YOUTUBE_API_KEY;
  
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('maxResults', maxResults.toString());
    searchUrl.searchParams.set('order', 'relevance');
    searchUrl.searchParams.set('key', apiKey!);
    searchUrl.searchParams.set('videoDuration', 'medium');
  
    const searchResponse = await fetch(searchUrl.toString());
    const searchData = await searchResponse.json();
    
    const videos: YouTubeVideo[] = searchData.items.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }));
  
    return videos;
  }
  
  export async function getTranscript(videoId: string): Promise<string> {
    const { YoutubeTranscript } = await import('youtube-transcript');
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    const fullText = transcript
      .map((segment: any) => segment.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  
    return fullText;
  }
  
  export async function getChannelStats(channelId: string) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const url = new URL('https://www.googleapis.com/youtube/v3/channels');
    url.searchParams.set('part', 'statistics,snippet');
    url.searchParams.set('id', channelId);
    url.searchParams.set('key', apiKey!);
  
    const response = await fetch(url.toString());
    const data = await response.json();
    const channel = data.items[0];
  
    return {
      subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
      channelTitle: channel.snippet.title,
      customUrl: channel.snippet.customUrl || '',
    };
  }