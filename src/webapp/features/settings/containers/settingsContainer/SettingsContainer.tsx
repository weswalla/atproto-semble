import { ButtonGroup, Container, Stack, Title } from '@mantine/core';
import AccountSummary from '../../components/accountSummary/AccountSummary';
import SettingItem from '../../components/settingItem/SettingItem';
import {
  IoMdColorPalette,
  IoMdHelpCircle,
  IoMdInformationCircle,
} from 'react-icons/io';

export default function SettingsContainer() {
  return (
    <Container p={'xs'} size={'xs'}>
      <Stack gap={'xl'}>
        <Title order={1}>Settings</Title>

        <AccountSummary />
        <ButtonGroup orientation="vertical">
          <SettingItem href="/settings/appearance" icon={IoMdColorPalette}>
            Appearance
          </SettingItem>
          <SettingItem href="/settings/help" icon={IoMdHelpCircle}>
            Help
          </SettingItem>
          <SettingItem href="/settings/about" icon={IoMdInformationCircle}>
            About
          </SettingItem>
        </ButtonGroup>
      </Stack>
    </Container>
  );
}
