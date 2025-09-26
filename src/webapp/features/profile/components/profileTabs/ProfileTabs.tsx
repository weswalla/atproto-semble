'use client';

import { Tabs } from '@mantine/core';
import TabItem from './TabItem';
import { usePathname } from 'next/navigation';

interface Props {
  handle: string;
}

export default function ProfileTabs({ handle }: Props) {
  const pathname = usePathname();
  const segment = pathname.split('/')[3];
  const currentTab = segment || 'profile'; // treat base route as 'profile'
  const basePath = `/profile/${handle}`;

  return (
    <Tabs value={currentTab}>
      <Tabs.List>
        <TabItem value="profile" href={basePath}>
          Profile
        </TabItem>
        <TabItem value="cards" href={`${basePath}/cards`}>
          Cards
        </TabItem>
        <TabItem value="collections" href={`${basePath}/collections`}>
          Collections
        </TabItem>
      </Tabs.List>
    </Tabs>
  );
}
