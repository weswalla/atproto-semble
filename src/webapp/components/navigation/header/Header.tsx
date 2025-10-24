import { Box, Divider, Group } from '@mantine/core';
import NavbarToggle from '../NavbarToggle';
import { ReactElement } from 'react';

interface Props {
  children?: ReactElement;
}

export default function Header(props: Props) {
  return (
    <Box>
      <Group gap={'xs'} p={'xs'} justify="space-between">
        {props.children}
        <Box ml={'auto'}>
          <NavbarToggle />
        </Box>
      </Group>
      <Divider />
    </Box>
  );
}
