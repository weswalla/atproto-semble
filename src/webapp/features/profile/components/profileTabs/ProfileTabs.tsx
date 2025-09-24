'use client';

import { Tabs } from '@mantine/core';
import TabItem from './TabItem';
import { usePathname } from 'next/navigation';

interface Props {
  handle: string;
}

export default function ProfileTabs(props: Props) {
  const pathname = usePathname();
  const currentTab = pathname.split('/').slice(3, 4).join('/') || 'profile';

  return (
    <Tabs defaultValue={'profile'} value={currentTab}>
      <Tabs.List>
        <TabItem value="profile" href={`/profile/${props.handle}`}>
          Profile
        </TabItem>
        <TabItem value="cards" href={`/profile/${props.handle}/cards`}>
          Cards
        </TabItem>
        <TabItem
          value="collections"
          href={`/profile/${props.handle}/collections`}
        >
          Collections
        </TabItem>
      </Tabs.List>
    </Tabs>
  );
}
