import { AppBskyEmbedImages } from '@atproto/api';
import { AspectRatio, SimpleGrid, Image } from '@mantine/core';
import type { EmbedMode } from '../../types';

interface Props {
  images: AppBskyEmbedImages.ViewImage[];
  mode?: EmbedMode;
}

export default function ImageEmbed(props: Props) {
  return (
    <SimpleGrid cols={props.images.length > 1 ? 2 : 1} spacing="xs">
      {props.images.map((img, i) => {
        const ratio =
          props.images.length === 1
            ? img?.aspectRatio
              ? img.aspectRatio.width / img.aspectRatio.height
              : 16 / 9
            : img?.aspectRatio
              ? img.aspectRatio.width / img.aspectRatio.height
              : 1 / 1;

        return (
          <AspectRatio ratio={ratio} key={i}>
            <Image
              src={img.thumb}
              alt={img.alt}
              radius="sm"
              h={'100%'}
              w={'100%'}
              mah={
                props.mode === 'card'
                  ? props.images.length === 1
                    ? 120
                    : 150
                  : '100%'
              }
            />
          </AspectRatio>
        );
      })}
    </SimpleGrid>
  );
}
