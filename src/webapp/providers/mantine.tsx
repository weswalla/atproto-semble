'use client';

import { theme } from '@/styles/theme';
import { MantineProvider as BaseProvider } from '@mantine/core';
import '@mantine/core/styles.css';

interface Props {
  children: React.ReactNode;
}

export default function MantineProvider(props: Props) {
  return <BaseProvider theme={theme}>{props.children}</BaseProvider>;
}
