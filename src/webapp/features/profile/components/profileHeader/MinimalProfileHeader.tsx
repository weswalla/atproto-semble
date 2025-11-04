import { Group, Avatar, Stack, Title, Text, Container } from '@mantine/core';

interface Props {
  avatarUrl?: string;
  name: string;
  handle: string;
}

export default function MinimalProfileHeader(props: Props) {
  return (
    <Container p={'xs'} size={'xl'} mx={0}>
      <Group gap={'sm'}>
        <Avatar
          src={props.avatarUrl}
          alt={`${props.name}'s avatar`}
          size={'md'}
        />

        <Stack gap={0}>
          <Title order={1} fz={'sm'}>
            {props.name}
          </Title>
          <Text c="blue" fw={600} fz={'sm'}>
            @{props.handle}
          </Text>
        </Stack>
      </Group>
    </Container>
  );
}
