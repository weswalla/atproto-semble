import GuestSembleActions from '@/features/semble/components/sembleActions/GusetSembleActions';
import SembleActions from '@/features/semble/components/sembleActions/SembleActions';
import UrlAddedBySummary from '@/features/semble/components/urlAddedBySummary/UrlAddedBySummary';
import { getDomain } from '@/lib/utils/link';
import {
  Stack,
  Tooltip,
  Anchor,
  Text,
  Avatar,
  Group,
  Box,
} from '@mantine/core';
import Link from 'next/link';
import { getBlueskyPost } from '../../lib/dal';
import { getPostUriFromUrl } from '@/lib/utils/atproto';
import { verifySessionOnServer } from '@/lib/auth/dal.server';
import { AppBskyFeedDefs, AppBskyFeedPost } from '@atproto/api';
import RichTextRenderer from '@/components/contentDisplay/richTextRenderer/RichTextRenderer';
import PostEmbed from '../../components/postEmbed/PostEmbed';
import { FaBluesky } from 'react-icons/fa6';
import SembleHeader from '@/features/semble/components/SembleHeader/SembleHeader';

interface Props {
  url: string;
}

export default async function BlueskySembleHeader(props: Props) {
  const postUri = getPostUriFromUrl(props.url);
  const data = await getBlueskyPost(postUri);
  const session = await verifySessionOnServer();

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
    <Stack gap={'sm'} mx={'auto'}>
      <Stack>
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
        <Stack gap={'xs'} maw={600}>
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
                textProps={{ lineClamp: 3 }}
              />
            </Box>
            {post.embed && <PostEmbed embed={post.embed} />}
          </Stack>
        </Stack>
      </Stack>

      <Stack gap={'sm'} align="center">
        {session ? (
          <SembleActions url={props.url} />
        ) : (
          <GuestSembleActions url={props.url} />
        )}
      </Stack>

      <UrlAddedBySummary url={props.url} />
    </Stack>
  );
}
