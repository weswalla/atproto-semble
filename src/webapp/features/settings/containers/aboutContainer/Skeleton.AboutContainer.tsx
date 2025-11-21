import {
  ButtonGroup,
  Card,
  Container,
  Stack,
  Image,
  Title,
  Text,
  Group,
} from '@mantine/core';
import SettingItem from '../../components/settingItem/SettingItem';
import { MdSpeakerNotes } from 'react-icons/md';
import { FaGithub } from 'react-icons/fa6';
import CosmikLogo from '@/assets/cosmik-logo-full.svg';
import CosmikLogoWhite from '@/assets/cosmik-logo-full-white.svg';
import CosmikBanner from '@/assets/cosmik-bg-banner-small.webp';
import SettingItemSkeleton from '../../components/settingItem/Skeleton.SettingItem';

export default function AboutContainerSkeleton() {
  return (
    <Container p="xs" size="xs">
      <Stack gap="xl">
        <Title order={1}>Loading</Title>
        <ButtonGroup orientation="vertical">
          <SettingItemSkeleton />
          <SettingItemSkeleton />
        </ButtonGroup>
        <Card
          component="a"
          href="https://cosmik.network/"
          target="_blank"
          p="sm"
          radius="lg"
          withBorder
          style={{
            backgroundImage: `url(${CosmikBanner.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Group
            gap="md"
            wrap="nowrap"
            style={{ position: 'relative', zIndex: 1 }}
          >
            <Stack gap="xs">
              <Image
                src={CosmikLogo.src}
                alt="Cosmik logo"
                w={92}
                h={28.4}
                darkHidden
              />
              {/* dark logo */}
              <Image
                src={CosmikLogoWhite.src}
                alt="Cosmik logo white"
                w={92}
                h={28.4}
                lightHidden
              />
              <Text fw={500}>
                Semble is lovingly built by the team at Cosmik Network
              </Text>
            </Stack>
          </Group>
        </Card>
      </Stack>
    </Container>
  );
}
