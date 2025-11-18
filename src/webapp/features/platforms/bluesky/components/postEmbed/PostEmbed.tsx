import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyEmbedVideo,
  AppBskyFeedDefs,
  AppBskyGraphDefs,
} from '@atproto/api';

import ImageEmbed from '../imageEmbed/ImageEmbed';
import ExternalEmbed from '../externalEmbed/ExternalEmbed';
import VideoEmbed from '../videoEmbed/VideoEmbed';
import ListEmbed from '../listEmbed/ListEmbed';
import StarterPackEmbed from '../starterPackEmbed/StarterPackEmbed';
import FeedEmbed from '../feedEmbed/FeedEmbed';
import RecordEmbed from '../recordEmbed/RecordEmbed';

interface Props {
  embed: AppBskyFeedDefs.PostView['embed'];
}

export default function PostEmbed({ embed }: Props) {
  switch (true) {
    case AppBskyEmbedImages.isView(embed):
      return <ImageEmbed images={embed.images} />;

    case AppBskyEmbedExternal.isView(embed):
      return <ExternalEmbed embed={embed} />;

    case AppBskyEmbedVideo.isView(embed):
      return <VideoEmbed embed={embed} />;

    // Check for Record first before accessing embed.record
    case AppBskyEmbedRecord.isView(embed): {
      const record = embed.record;

      if (AppBskyGraphDefs.isStarterPackViewBasic(record)) {
        return <StarterPackEmbed embed={record} />;
      }

      if (AppBskyFeedDefs.isGeneratorView(record)) {
        return <FeedEmbed feed={record} />;
      }

      if (AppBskyGraphDefs.isListView(record)) {
        return <ListEmbed list={record} />;
      }

      return <RecordEmbed embed={record} />;
    }

    case AppBskyEmbedRecordWithMedia.isView(embed):
      return <RecordEmbed embed={embed.record.record} media={embed.media} />;

    default:
      return <>default</>;
  }
}
