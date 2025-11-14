import { AtpAgent } from '@atproto/api';
import { cache } from 'react';

export const getBlueskyPost = cache(async (uri: string) => {
  const agent = new AtpAgent({ service: 'https://public.api.bsky.app' });
  try {
    const post = await agent.getPostThread({
      uri: uri,
      depth: 0,
      parentHeight: 0,
    });
    return post.data;
  } catch (error) {
    throw new Error('Could not load bluesky post');
  }
});
