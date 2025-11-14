import useGetBlueskyPost from '../../lib/queries/useGetBlueskyPost';

interface Props {
  uri: string;
}

export default function BlueskyPost(props: Props) {
  const { data } = useGetBlueskyPost({ uri: props.uri });
  console.log('data: ', data);

  return <>Bluesky post</>;
}
