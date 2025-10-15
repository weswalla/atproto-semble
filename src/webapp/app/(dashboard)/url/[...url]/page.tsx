interface Props {
  params: Promise<{ url: string[] }>;
}

export default async function Page(props: Props) {
  const { url } = await props.params;

  return <>{url}</>;
}
