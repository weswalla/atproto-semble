import { AtpAgent } from '@atproto/api';
import { cache } from 'react';

export const getBlueskyPost = cache(async (uri: string) => {
  const agent = new AtpAgent({ service: 'https://public.api.bsky.app' });

  const post = await agent.getPostThread({
    uri: uri,
    depth: 0,
    parentHeight: 0,
  });

  if (!post.success) {
    throw new Error('Could not load bluesky post');
  }

  return post.data;
});
