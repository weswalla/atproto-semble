import { Title, Text, Stack, Button, Center, Anchor } from '@mantine/core';
import { FaBluesky } from 'react-icons/fa6';

export default function Page() {
  return (
    <Center h={'100svh'}>
      <Stack align="center" gap="xl" maw={450}>
        <Stack gap={0}>
          <Title order={1} ta="center">
            Welcome
          </Title>
          <Text fz={'h3'} fw={700} ta={'center'} c={'gray'}>
            Sign up to get started
          </Text>
        </Stack>

        <Text fw={500} ta="center" maw={380}>
          When you sign up today, you’ll create a Bluesky account. In near
          future, your account will be seamlessly migrated to our{' '}
          <Anchor
            href="https://cosmik.network"
            target="_blank"
            fw={500}
            c={'blue'}
          >
            Cosmik Network
          </Anchor>
          .
        </Text>

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
          <Text fw={500} c={'gray'}>
            Already have an account?{' '}
            <Anchor href="/login" fw={500}>
              Log in
            </Anchor>
          </Text>
        </Stack>
      </Stack>
    </Center>
  );
}
