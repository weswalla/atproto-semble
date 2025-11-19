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
import type { EmbedMode } from '../../types';

interface Props {
  embed: AppBskyFeedDefs.PostView['embed'];
  mode?: EmbedMode;
}

export default function PostEmbed(props: Props) {
  switch (true) {
    case AppBskyEmbedImages.isView(props.embed):
      return <ImageEmbed images={props.embed.images} mode={props.mode} />;

    case AppBskyEmbedExternal.isView(props.embed):
      return <ExternalEmbed embed={props.embed} mode={props.mode} />;

    case AppBskyEmbedVideo.isView(props.embed):
      return <VideoEmbed embed={props.embed} />;

    // check for Record first before accessing embed.record
    case AppBskyEmbedRecord.isView(props.embed): {
      const record = props.embed.record;

      if (AppBskyGraphDefs.isStarterPackViewBasic(record)) {
        return <StarterPackEmbed embed={record} mode={props.mode} />;
      }

      if (AppBskyFeedDefs.isGeneratorView(record)) {
        return <FeedEmbed feed={record} mode={props.mode} />;
      }

      if (AppBskyGraphDefs.isListView(record)) {
        return <ListEmbed list={record} mode={props.mode} />;
      }

      return <RecordEmbed embed={record} mode={props.mode} />;
    }

    case AppBskyEmbedRecordWithMedia.isView(props.embed):
      return (
        <RecordEmbed
          embed={props.embed.record.record}
          media={props.embed.media}
          mode={props.mode}
        />
      );

    default:
      return null;
  }
}
