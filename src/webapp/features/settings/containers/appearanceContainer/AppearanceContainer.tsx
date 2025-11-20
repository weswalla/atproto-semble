'use client';

import { Container, Stack, Title, SegmentedControl } from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';

export default function AppearanceContainer() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <Container p="xs" size="xs">
      <Stack gap="xl">
        <Title order={1}>Appearance</Title>

        <SegmentedControl
          size="md"
          value={colorScheme}
          onChange={(value) =>
            setColorScheme(value as 'light' | 'dark' | 'auto')
          }
          data={[
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
            { label: 'Auto', value: 'auto' },
          ]}
        />
      </Stack>
    </Container>
  );
}
