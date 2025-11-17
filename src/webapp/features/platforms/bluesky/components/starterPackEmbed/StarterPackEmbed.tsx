import { AppBskyGraphDefs, AppBskyGraphStarterpack } from '@atproto/api';
import { Box, Card, CardSection, Image, Text } from '@mantine/core';
import { getStarterPackImage } from '../../lib/utils/link';

interface Props {
  embed: AppBskyGraphDefs.StarterPackViewBasic;
}

export default function StarterPackEmbed(props: Props) {
  if (!AppBskyGraphStarterpack.isRecord(props.embed.record)) {
    return null;
  }

  const image = getStarterPackImage(props.embed);
  return (
    <Card withBorder p={0}>
      {image && (
        <CardSection>
          <Image src={image} />
        </CardSection>
      )}
      <Box p={'xs'}>
        <Text fz={'sm'} fw={500} c={'bright'} lineClamp={1}>
          Starter pack
        </Text>
        <Text fz={'sm'} fw={500} c={'gray'} lineClamp={1} span>
          @{props.embed.creator.handle}
        </Text>
      </Box>
    </Card>
  );
}
