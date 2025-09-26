import type { Metadata } from 'next';
import Header from '@/components/navigation/header/Header';
import ProfileHeader from '@/features/profile/components/profileHeader/ProfileHeader';
import ProfileTabs from '@/features/profile/components/profileTabs/ProfileTabs';
import { Box, Container } from '@mantine/core';
import { Fragment, Suspense } from 'react';
import { ApiClient } from '@/api-client/ApiClient';
import { createClientTokenManager } from '@/services/auth';
import ProfileHeaderSkeleton from '@/features/profile/components/profileHeader/Skeleton.ProfileHeader';

interface Props {
  params: Promise<{ handle: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;

  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    createClientTokenManager(),
  );

  const profile = await apiClient.getProfile({
    identifier: handle,
  });

  return {
    title: profile.name,
    description:
      profile.description ?? `Explore ${profile.name}'s profile on Semble`,
  };
}

export default async function Layout(props: Props) {
  const { handle } = await props.params;

  return (
    <Fragment>
      <Header />
      <Suspense fallback={<ProfileHeaderSkeleton />} key={handle}>
        <ProfileHeader handle={handle} />
      </Suspense>
      <Box
        style={{
          position: 'sticky',
          top: 59,
          zIndex: 1,
        }}
      >
        <Container bg={'white'} px={'xs'} mt={'md'} size={'xl'}>
          <ProfileTabs handle={handle} />
        </Container>
      </Box>
      {props.children}
    </Fragment>
  );
}
