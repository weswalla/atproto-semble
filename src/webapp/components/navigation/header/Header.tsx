import { Box, Divider, Group, Paper } from '@mantine/core';
import NavbarToggle from '../NavbarToggle';
import { ReactElement } from 'react';

interface Props {
  children?: ReactElement;
}

export default function Header(props: Props) {
  return (
    <Paper pos={'sticky'} top={0} style={{ zIndex: 1 }}>
      <Group gap={'xs'} p={'xs'} justify="space-between">
        {props.children}
        <Box ml={'auto'}>
          <NavbarToggle />
        </Box>
      </Group>
      <Divider />
    </Paper>
  );
}
