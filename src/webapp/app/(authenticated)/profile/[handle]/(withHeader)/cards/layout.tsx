import Header from '@/components/navigation/header/Header';
import type { Metadata } from 'next';
import { Fragment } from 'react';

export const metadata: Metadata = {
  title: 'My Cards',
  description: 'All my cards',
};

interface Props {
  children: React.ReactNode;
}

export default function Layout(props: Props) {
  return <Fragment>{props.children}</Fragment>;
}
