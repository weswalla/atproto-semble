import { AppBskyGraphDefs, AtUri } from '@atproto/api';

export const getStarterPackImage = (
  starterPack: AppBskyGraphDefs.StarterPackViewBasic,
) => {
  const rkey = new AtUri(starterPack.uri).rkey;
  return `https://ogcard.cdn.bsky.app/start/${starterPack.creator.did}/${rkey}`;
};
