import { AppBskyEmbedImages } from '@atproto/api';
import { AspectRatio, SimpleGrid, Image } from '@mantine/core';

interface Props {
  images: AppBskyEmbedImages.ViewImage[];
}

export default function ImageEmbed(props: Props) {
  return (
    <SimpleGrid cols={props.images.length} spacing="xs">
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
              mah={props.images.length === 1 ? 200 : 'auto'}
              fit={props.images.length === 1 ? 'contain' : 'cover'}
            />
          </AspectRatio>
        );
      })}
    </SimpleGrid>
  );
}
