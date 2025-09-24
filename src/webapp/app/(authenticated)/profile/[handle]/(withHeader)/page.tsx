import ProfileContainer from '@/features/profile/containers/profileContainer/ProfileContainer';

interface Props {
  params: Promise<{ handle: string }>;
}

export default async function Page(props: Props) {
  const { handle } = await props.params;

  return <ProfileContainer handle={handle} />;
}
