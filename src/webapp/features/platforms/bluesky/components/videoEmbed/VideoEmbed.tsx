import { AppBskyEmbedVideo } from '@atproto/api';
import { AspectRatio, Image } from '@mantine/core';

interface Props {
  embed: AppBskyEmbedVideo.View;
}

export default function VideoEmbed(props: Props) {
  return (
    <AspectRatio ratio={16 / 9}>
      <Image src={props.embed.thumbnail} alt={props.embed.alt} radius={'sm'} />
    </AspectRatio>
  );
}
