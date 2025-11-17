import { AppBskyFeedDefs, AppBskyFeedPost } from '@atproto/api';
import { ReactElement } from 'react';
import { Group, Stack, Text, Avatar, Box } from '@mantine/core';
import RichTextRenderer from '@/components/contentDisplay/richTextRenderer/RichTextRenderer';
import useGetBlueskyPost from '../../lib/queries/useGetBlueskyPost';
import PostEmbed from '../postEmbed/PostEmbed';

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
  const record = post.record as AppBskyFeedPost.Record;

  return (
    <Stack justify="space-between" align="start" gap="sm">
      <Group gap="xs">
        <Avatar
          src={post.author.avatar}
          alt={`${post.author.handle} social preview image`}
          radius="xl"
        />

        <Stack gap={0} flex={1}>
          <Text c="bright" lineClamp={1} fw={500} w="fit-content">
            {post.author.displayName || post.author.handle}
          </Text>
          <Text c="gray" lineClamp={1} w="fit-content">
            @{post.author.handle}
          </Text>
        </Stack>
      </Group>
      <Stack gap={'xs'}>
        <Box>
          <RichTextRenderer text={record.text} textProps={{ lineClamp: 3 }} />
        </Box>
        {post.embed && <PostEmbed embed={post.embed} />}
      </Stack>
    </Stack>
  );
}
