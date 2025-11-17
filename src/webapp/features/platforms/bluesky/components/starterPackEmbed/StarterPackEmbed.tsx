import { AppBskyGraphDefs, AppBskyGraphStarterpack } from '@atproto/api';
import { Card, CardSection, Image, Text } from '@mantine/core';
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
    <Card>
      {image && (
        <CardSection>
          <Image src={image} />
        </CardSection>
      )}
      <Text fz={'sm'} fw={500} c={'gray'} lineClamp={1}>
        By {props.embed.creator.handle}
      </Text>
    </Card>
  );
}
