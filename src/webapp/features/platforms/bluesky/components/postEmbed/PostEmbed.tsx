import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyFeedDefs,
} from '@atproto/api';
import ImageEmbed from '../imageEmbed/ImageEmbed';
import ExternalEmbed from '../externalEmbed/ExternalEmbed';

interface Props {
  embed: AppBskyFeedDefs.FeedViewPost['post']['embed'];
}
export default function PostEmbed(props: Props) {
  switch (true) {
    case AppBskyEmbedImages.isView(props.embed):
      return <ImageEmbed images={props.embed.images} />;
    case AppBskyEmbedExternal.isView(props.embed):
      return <ExternalEmbed embed={props.embed} />;
    default:
      return <>default</>;
  }
}
