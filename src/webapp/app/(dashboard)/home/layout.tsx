import Header from '@/components/navigation/header/Header';
import { SPLASH_IMAGES } from '@/lib/consts/images';
import type { Metadata } from 'next';
import { Fragment } from 'react';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Home',
  appleWebApp: {
    title: 'Semble',
    capable: true,
    statusBarStyle: 'default',
    startupImage: SPLASH_IMAGES,
  },
  other: { 'apple-mobile-web-app-capable': 'yes' },
};

interface Props {
  children: React.ReactNode;
}

export default function Layout(props: Props) {
  return (
    <Fragment>
      <Header />
      {props.children}
    </Fragment>
  );
}
