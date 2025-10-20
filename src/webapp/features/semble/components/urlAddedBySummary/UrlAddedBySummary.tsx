import { Avatar, AvatarGroup, Group, Text } from '@mantine/core';
import { getLibrariesForUrl } from '../../lib/dal';
import Link from 'next/link';

interface Props {
  url: string;
}

export default async function UrlAddedBySummary(props: Props) {
  const data = await getLibrariesForUrl(props.url);

  const MAX_PROFILES_TO_SHOW = 3;
  const names = data.libraries
    .slice(0, MAX_PROFILES_TO_SHOW)
    .map((p) => p.userId);
  const hasMore = data.libraries.length > MAX_PROFILES_TO_SHOW;
  const followersSummaryText =
    'Added by ' + names.join(', ') + (hasMore ? ', and others' : '');

  if (data.libraries.length === 0) {
    return null;
  }

  return (
    <Group gap={'xs'}>
      {/*<AvatarGroup spacing={'xs'}>
          {avatars.slice(0, MAX_PROFILES_TO_SHOW).map((p, i) => (
            <Avatar
              key={i}
              component={Link}
              href={`/dashboard/profile/${p.handle}`}
              src={p.avatarUrl}
              alt={`${p.handle}`}
              name={p.handle}
              size={30}
            />
          ))}
        </AvatarGroup>*/}
      <Text fz={'sm'} fw={500} c={'gray'}>
        {followersSummaryText}
      </Text>
    </Group>
  );
}
