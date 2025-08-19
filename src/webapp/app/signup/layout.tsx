import { Container } from '@mantine/core';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign up',
  description: 'Sign up to get started',
};

interface Props {
  children: React.ReactNode;
}

export default function Layout(props: Props) {
  return <Container p={'sm'}>{props.children}</Container>;
}
