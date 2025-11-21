import { ButtonGroup, Container, Stack, Title } from '@mantine/core';
import AccountSummarySkeleton from '../../components/accountSummary/Skeleton.AccountSummary';
import SettingItemSkeleton from '../../components/settingItem/Skeleton.SettingItem';

export default function SettingsContainerSkeleton() {
  return (
    <Container p={'xs'} size={'xs'}>
      <Stack gap={'xl'}>
        <Title order={1}>Settings</Title>

        <AccountSummarySkeleton />
        <Stack>
          <ButtonGroup orientation="vertical">
            <SettingItemSkeleton />
            <SettingItemSkeleton />
            <SettingItemSkeleton />
          </ButtonGroup>
          <SettingItemSkeleton />
        </Stack>
      </Stack>
    </Container>
  );
}
