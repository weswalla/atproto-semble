'use client';

import { Tabs } from '@mantine/core';
import TabItem from './TabItem';
import { usePathname, useRouter } from 'next/navigation';

interface Props {
  handle: string;
}

export default function ProfileTabs({ handle }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const segment = pathname.split('/')[3];
  const currentTab = segment || 'profile'; // treat base route as 'profile'

  const handleTabChange = (value: string | null) => {
    if (!value || value === 'profile') {
      router.push(`/profile/${handle}`);
    } else {
      router.push(`/profile/${handle}/${value}`);
    }
  };

  return (
    <Tabs value={currentTab} onChange={handleTabChange}>
      <Tabs.List>
        <TabItem value="profile">Profile</TabItem>
        <TabItem value="cards">Cards</TabItem>
        <TabItem value="collections">Collections</TabItem>
      </Tabs.List>
    </Tabs>
  );
}
