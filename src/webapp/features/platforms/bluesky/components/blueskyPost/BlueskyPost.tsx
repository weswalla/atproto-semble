import { AppBskyFeedDefs, AppBskyFeedPost } from '@atproto/api';
import { ReactElement } from 'react';
import { Group, Stack, Text, AspectRatio, Avatar } from '@mantine/core';
import useGetBlueskyPost from '../../lib/queries/useGetBlueskyPost';
import RichTextRenderer from '@/components/contentDisplay/richTextRenderer/RichTextRenderer';
import { isFeedViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs';

interface Props {
  uri: string;
  fallbackCardContent: ReactElement;
}

export default function BlueskyPost(props: Props) {
  const { data, error } = useGetBlueskyPost({ uri: props.uri });

  if (
    !data.thread ||
    !AppBskyFeedDefs.isThreadViewPost(data.thread) ||
    AppBskyFeedDefs.isNotFoundPost(data.thread.post) ||
    AppBskyFeedDefs.isBlockedPost(data.thread.post) ||
    error
  ) {
    return props.fallbackCardContent;
  }

  const post = data.thread.post;
  const record = post.record;

  const isRecord = AppBskyFeedPost.isRecord(record) && isFeedViewPost(post);
  const text = isRecord && record.text;

  return (
    <Group justify="space-between" align="start" gap="lg">
      <Group gap="xs">
        <AspectRatio ratio={1 / 1}>
          <Avatar
            src={post.author.avatar}
            alt={`${post.author.handle} social preview image`}
            radius="xl"
          />
        </AspectRatio>
        <Stack gap={0} flex={1}>
          <Text c="bright" lineClamp={1} fw={500} w="fit-content">
            {post.author.displayName || post.author.handle}
          </Text>
          <Text c="gray" lineClamp={1} w="fit-content">
            @{post.author.handle}
          </Text>
        </Stack>
        {/*<RichTextRenderer text={text} />*/}
      </Group>
    </Group>
  );
}
