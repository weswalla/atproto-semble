import { AppBskyFeedDefs, AppBskyFeedPost } from '@atproto/api';
import { ReactElement } from 'react';
import { Group, Stack, Text, Avatar, Box } from '@mantine/core';
import RichTextRenderer from '@/components/contentDisplay/richTextRenderer/RichTextRenderer';
import useGetBlueskyPost from '../../lib/queries/useGetBlueskyPost';
import PostEmbed from '../postEmbed/PostEmbed';
import { FaBluesky } from 'react-icons/fa6';

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
    <Stack justify="space-between" gap="xs">
      <Group gap="xs" justify="space-between" wrap="nowrap" w={'100%'}>
        <Group gap={'xs'} wrap="nowrap">
          <Avatar
            src={post.author.avatar}
            alt={`${post.author.handle} social preview image`}
            size={'sm'}
            radius="xl"
          />

          <Text c="bright" lineClamp={1} fw={500}>
            {post.author.displayName || post.author.handle}
          </Text>
        </Group>

        <FaBluesky fill="#0085ff" size={18} />
      </Group>
      <Stack gap={'xs'} w={'100%'}>
        <Box>
          <RichTextRenderer text={record.text} textProps={{ lineClamp: 3 }} />
        </Box>
        {post.embed && <PostEmbed embed={post.embed} mode="compact" />}
      </Stack>
    </Stack>
  );
}
