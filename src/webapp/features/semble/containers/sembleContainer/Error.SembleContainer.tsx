import { Alert, Container } from '@mantine/core';

export default function SembleContainerError() {
  return (
    <Container p="xs" fluid>
      <Alert color="red" title="Could not load semble page" />
    </Container>
  );
}
