'use client';

import Header from '@/components/navigation/header/Header';
import ProfileContainer from '@/features/profile/containers/profileContainer/ProfileContainer';
import { Fragment } from 'react';

export default function Page() {
  return (
    <Fragment>
      <Header />
      <ProfileContainer />
    </Fragment>
  );
}
