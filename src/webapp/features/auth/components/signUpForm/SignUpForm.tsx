import { Text, Stack, Button, Anchor } from '@mantine/core';
import { FaBluesky } from 'react-icons/fa6';

export default function SignUpForm() {
  return (
    <Stack gap="xs">
      <Button
        component="a"
        href="https://bsky.app/"
        target="_blank"
        size="lg"
        color="dark"
        leftSection={<FaBluesky size={22} />}
      >
        Sign up on Bluesky
      </Button>
      <Text fw={500} c={'stone'}>
        Already have an account?{' '}
        <Anchor href="/login" fw={500}>
          Log in
        </Anchor>
      </Text>
    </Stack>
  );
}
