import { AppBskyFeedDefs, AppBskyFeedPost } from '@atproto/api';
import { getBlueskyPost } from '../../lib/dal';
import SembleHeader from '@/features/semble/components/SembleHeader/SembleHeader';
import { getPostUriFromUrl } from '@/lib/utils/atproto';
import RichTextRenderer from '@/components/contentDisplay/richTextRenderer/RichTextRenderer';
import { getDomain } from '@/lib/utils/link';
import { getFormattedDate } from '@/lib/utils/time';
import {
  Stack,
  Tooltip,
  Anchor,
  Card,
  Group,
  Avatar,
  Box,
  Text,
} from '@mantine/core';
import Link from 'next/link';
import { FaBluesky } from 'react-icons/fa6';
import PostEmbed from '../postEmbed/PostEmbed';

interface Props {
  url: string;
}

export default async function BlueskySemblePost(props: Props) {
  const postUri = getPostUriFromUrl(props.url);
  const data = await getBlueskyPost(postUri);

  if (
    !data.thread ||
    !AppBskyFeedDefs.isThreadViewPost(data.thread) ||
    AppBskyFeedDefs.isNotFoundPost(data.thread.post) ||
    AppBskyFeedDefs.isBlockedPost(data.thread.post)
  ) {
    // fallback
    return <SembleHeader url={props.url} />;
  }

  const post = data.thread.post;
  const record = post.record as AppBskyFeedPost.Record;

  return (
    <Stack gap={'xs'}>
      <Text>
        <Text fw={700} c="tangerine" span>
          Semble
        </Text>
        <Text fw={700} c={'gray'} span>
          {` · `}
        </Text>
        <Tooltip label={props.url}>
          <Anchor
            component={Link}
            target="_blank"
            fw={700}
            c={'blue'}
            href={props.url}
          >
            {getDomain(props.url)}
          </Anchor>
        </Tooltip>
      </Text>

      {/* Post */}
      <Card radius={'lg'} withBorder>
        <Stack gap={'xs'}>
          <Group gap="xs" justify="space-between" wrap="nowrap">
            <Group gap={'xs'} wrap="nowrap">
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
            <FaBluesky fill="#0085ff" size={18} />
          </Group>
          <Stack gap={'xs'} w={'100%'}>
            <Box>
              <RichTextRenderer
                text={record.text}
                textProps={{ c: 'bright' }}
              />
            </Box>
            {post.embed && <PostEmbed embed={post.embed} />}
          </Stack>
          <Text c={'gray'} fz={'sm'} fw={500}>
            {getFormattedDate(post.indexedAt)}
          </Text>
        </Stack>
      </Card>
    </Stack>
  );
}
