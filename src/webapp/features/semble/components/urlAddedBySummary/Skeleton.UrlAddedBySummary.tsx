import { Avatar, Group, Skeleton } from '@mantine/core';

export default function UrlAddedBySummarySkeleton() {
  return (
    <Group gap={'xs'}>
      <Avatar src={null} />
      <Skeleton w={'30%'} h={14} />
    </Group>
  );
}
