import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Semble bookmarklet',
  description:
    'Learn how to add our bookmarklet to your browser to quickly open any webpage in Semble.',
};

interface Props {
  children: React.ReactNode;
}

export default function Layout(props: Props) {
  return props.children;
}
