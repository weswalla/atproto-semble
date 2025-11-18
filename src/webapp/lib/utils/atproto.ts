export const getRecordKey = (path: string) => path.split('/').pop() || '';

export const getPostUriFromUrl = (url: string) => {
  const match = url.match(/profile\/([^/]+)\/post\/([^/]+)/);

  if (match) {
    const [, handle, postId] = match;
    return `at://${handle}/app.bsky.feed.post/${postId}`;
  }

  return url;
};
