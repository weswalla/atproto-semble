import { ButtonGroup, Container, Stack, Title } from '@mantine/core';
import SettingItem from '../../components/settingItem/SettingItem';
import { MdSpeakerNotes } from 'react-icons/md';
import { FaGithub } from 'react-icons/fa6';

export default function AboutContainer() {
  return (
    <Container p="xs" size="xs">
      <Stack gap="xl">
        <Title order={1}>About</Title>
        <ButtonGroup orientation="vertical">
          <SettingItem
            href="https://blog.cosmik.network/"
            icon={MdSpeakerNotes}
          >
            Follow our blog for updates
          </SettingItem>

          <SettingItem
            href="https://github.com/cosmik-network/semble"
            icon={FaGithub}
          >
            View source code
          </SettingItem>
        </ButtonGroup>
      </Stack>
    </Container>
  );
}
