import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Collections',
};

interface Props {
  children: React.ReactNode;
}

export default function Layout(props: Props) {
  return props.children;
}
