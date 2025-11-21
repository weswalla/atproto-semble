import { Container, Stack, Title, ButtonGroup } from '@mantine/core';
import SettingItemSkeleton from '../../components/settingItem/Skeleton.SettingItem';

export default function HelpContainerSkeleton() {
  return (
    <Container p="xs" size="xs">
      <Stack gap="xl">
        <Title order={1}>Help</Title>
        <ButtonGroup orientation="vertical">
          <SettingItemSkeleton />
          <SettingItemSkeleton />
          <SettingItemSkeleton />
        </ButtonGroup>
      </Stack>
    </Container>
  );
}
