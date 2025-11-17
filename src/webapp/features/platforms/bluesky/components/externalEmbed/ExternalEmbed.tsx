import { getDomain } from '@/lib/utils/link';
import { AppBskyEmbedExternal } from '@atproto/api';
import {
  AspectRatio,
  Card,
  CardSection,
  Image,
  Stack,
  Text,
} from '@mantine/core';

interface Props {
  embed: AppBskyEmbedExternal.View;
}

export default function ExternalEmbed(props: Props) {
  return (
    <Card p={0} withBorder>
      <CardSection>
        {props.embed.external.thumb && (
          <AspectRatio ratio={16 / 9}>
            <Image
              src={props.embed.external.thumb}
              alt={props.embed.external.description}
            />
          </AspectRatio>
        )}
      </CardSection>

      <Stack gap={0} p={'xs'}>
        <Text fz={'sm'} fw={500} c={'bright'} lineClamp={1}>
          {props.embed.external.title}
        </Text>
        <Text fz={'sm'} fw={500} c={'gray'} lineClamp={1}>
          {getDomain(props.embed.external.uri)}
        </Text>
      </Stack>
    </Card>
  );
}
