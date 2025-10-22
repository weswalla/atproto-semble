import {
  Stack,
  Title,
  Text,
  Anchor,
  Image,
  Grid,
  GridCol,
  Tooltip,
  Spoiler,
} from '@mantine/core';
import Link from 'next/link';
import { getUrlMetadata } from '@/features/cards/lib/dal';
import { getDomain } from '@/lib/utils/link';
import UrlAddedBySummary from '../urlAddedBySummary/UrlAddedBySummary';

interface Props {
  url: string;
}

export default async function SembleHeader(props: Props) {
  const { metadata } = await getUrlMetadata(props.url);

  return (
    <Stack gap={'xl'}>
      <Grid gutter={'lg'} justify="space-between">
        <GridCol span={{ base: 'auto' }}>
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
                <Title order={1} lh={0.8}>
                  {metadata.title}
                </Title>
              )}
            </Stack>
            {metadata.description && (
              <Spoiler showLabel={'Read more'} hideLabel={'See less'}>
                <Text c="gray" fw={500}>
                  {metadata.description}
                </Text>
              </Spoiler>
            )}
          </Stack>
        </GridCol>
        <GridCol span={{ base: 12, sm: 'content' }}>
          <Stack gap={'sm'} align="start">
            {metadata.imageUrl && (
              <Image
                src={metadata.imageUrl}
                alt={`${props.url} social preview image`}
                radius={'md'}
                mah={150}
                w={'auto'}
                maw={'100%'}
                fit="contain"
              />
            )}
            {/*<SembleActions />*/}
          </Stack>
        </GridCol>
      </Grid>
      <UrlAddedBySummary url={props.url} />
    </Stack>
  );
}
