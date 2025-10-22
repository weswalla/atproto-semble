export const getDomain = (url: string) => {
  return new URL(url).hostname;
};

export const getUrlFromSlug = (slug: string[]) => {
  const decoded = slug.map(decodeURIComponent);
  const url = decoded.join('/');

  // only normalize if the scheme has a single slash after it (i.e. malformed)
  const normalizedUrl = /^([a-zA-Z]+:)\/[^/]/.test(url)
    ? url.replace(/^([a-zA-Z]+:)\//, '$1//')
    : url;

  return normalizedUrl;
};
