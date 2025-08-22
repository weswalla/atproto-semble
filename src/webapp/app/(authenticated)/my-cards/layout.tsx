import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Cards',
  description: 'All my cards',
};

interface Props {
  children: React.ReactNode;
}

export default function Layout(props: Props) {
  return props.children;
}
