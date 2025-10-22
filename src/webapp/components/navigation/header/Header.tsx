import { Box, Divider, Group } from '@mantine/core';
import NavbarToggle from '../NavbarToggle';
import BackButton from '../backButton/BackButton';

export default function Header() {
  return (
    <Box>
      <Group gap={'xs'} p={'xs'} justify="space-between">
        <BackButton />
        <NavbarToggle />
      </Group>
      <Divider />
    </Box>
  );
}
