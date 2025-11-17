import { AppBskyEmbedImages, AppBskyFeedDefs } from '@atproto/api';
import ImageEmbed from '../imageEmbed/ImageEmbed';

interface Props {
  embed: AppBskyFeedDefs.FeedViewPost['post']['embed'];
}
export default function PostEmbed(props: Props) {
  switch (true) {
    case AppBskyEmbedImages.isView(props.embed):
      return <ImageEmbed images={props.embed.images} />;

    default:
      return <>default</>;
  }
}
