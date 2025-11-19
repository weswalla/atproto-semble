import { getUrlMetadata } from '@/features/cards/lib/dal';
import { getDomain } from '@/lib/utils/link';
import { Stack, Tooltip, Anchor, Title, Text, Spoiler } from '@mantine/core';
import Link from 'next/link';

interface Props {
  url: string;
}

export default async function UrlMetadataHeader(props: Props) {
  const { metadata } = await getUrlMetadata(props.url);

  return (
    <Stack>
      <Stack gap={0}>
        <Text>
          <Text fw={700} c="tangerine" span>
            Semble
          </Text>
          <Text fw={700} c={'gray'} span>
            {` · `}
          </Text>
          <Tooltip label={metadata.url}>
            <Anchor
              component={Link}
              target="_blank"
              fw={700}
              c={'blue'}
              href={metadata.url}
            >
              {getDomain(metadata.url)}
            </Anchor>
          </Tooltip>
        </Text>

        {metadata.title && (
          <Anchor
            component={Link}
            href={metadata.url}
            target="_blank"
            c={'inherit'}
            w={'fit-content'}
          >
            <Title order={1}>{metadata.title}</Title>
          </Anchor>
        )}
      </Stack>
      {metadata.description && (
        <Spoiler showLabel={'Read more'} hideLabel={'See less'}>
          <Text c="gray" fw={500} maw={650}>
            {metadata.description}
          </Text>
        </Spoiler>
      )}
    </Stack>
  );
}
