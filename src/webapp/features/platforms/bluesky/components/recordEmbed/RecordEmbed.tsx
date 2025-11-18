import RichTextRenderer from '@/components/contentDisplay/richTextRenderer/RichTextRenderer';
import { AppBskyEmbedRecord, AppBskyFeedPost } from '@atproto/api';
import { Stack, Group, Avatar, Box, Text, Card } from '@mantine/core';
import { record } from 'zod';
import PostEmbed from '../postEmbed/PostEmbed';

interface Props {
  embed: AppBskyEmbedRecord.View['record'];
}

export default function RecordEmbed(props: Props) {
  if (
    AppBskyEmbedRecord.isViewBlocked(props.embed) ||
    AppBskyEmbedRecord.isViewNotFound(props.embed) ||
    !AppBskyEmbedRecord.isViewRecord(props.embed)
  ) {
    return null;
  }

  const post = props.embed;

  return (
    <Card p={'sm'} flex={1} h={'100%'} withBorder>
      <Stack justify="space-between" align="start" gap="sm">
        <Group gap="xs">
          <Avatar
            src={post.author.avatar}
            alt={`${post.author.handle} social preview image`}
            radius="xl"
            size={'sm'}
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
            <RichTextRenderer
              text={(post.value as AppBskyFeedPost.Record).text}
              textProps={{ lineClamp: 1 }}
            />
          </Box>
          {post.embeds && <PostEmbed embed={post.embeds[0]} />}
        </Stack>
      </Stack>
    </Card>
  );
}
