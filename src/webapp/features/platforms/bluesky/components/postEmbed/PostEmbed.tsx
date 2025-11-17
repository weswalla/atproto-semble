import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedVideo,
  AppBskyFeedDefs,
  AppBskyGraphDefs,
} from '@atproto/api';
import ImageEmbed from '../imageEmbed/ImageEmbed';
import ExternalEmbed from '../externalEmbed/ExternalEmbed';
import VideoEmbed from '../videoEmbed/VideoEmbed';
import ListEmbed from '../listEmbed/ListEmbed';

interface Props {
  embed: AppBskyFeedDefs.PostView['embed'];
}

export default function PostEmbed(props: Props) {
  const content = props.embed;

  switch (true) {
    case AppBskyEmbedImages.isView(content):
      return <ImageEmbed images={content.images} />;
    case AppBskyEmbedExternal.isView(content):
      return <ExternalEmbed embed={content} />;
    case AppBskyEmbedVideo.isView(content):
      return <VideoEmbed embed={content} />;
    case AppBskyEmbedRecord.isView(content) &&
      AppBskyGraphDefs.isListView(content.record):
      return <ListEmbed list={content.record} />;

    default:
      return <>default</>;
  }
}
