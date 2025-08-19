import { Center, Container } from '@mantine/core';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Welcome back',
};

interface Props {
  children: React.ReactNode;
}

export default function Layout(props: Props) {
  return (
    <Container p={'sm'}>
      <Center h={'100svh'}>{props.children}</Center>
    </Container>
  );
}
