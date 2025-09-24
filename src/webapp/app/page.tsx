import {
  ActionIcon,
  SimpleGrid,
  Image,
  Text,
  BackgroundImage,
  Title,
  Stack,
  Button,
  Container,
  Box,
  Center,
  Group,
  Anchor,
} from '@mantine/core';
import { FaBluesky, FaGithub, FaDiscord } from 'react-icons/fa6';
import { BiRightArrowAlt } from 'react-icons/bi';
import { RiArrowRightUpLine } from 'react-icons/ri';
import BG from '@/assets/semble-bg.webp';
import CosmikLogo from '@/assets/cosmik-logo-full.svg';
import CurateIcon from '@/assets/icons/curate-icon.svg';
import CommunityIcon from '@/assets/icons/community-icon.svg';
import DBIcon from '@/assets/icons/db-icon.svg';
import BigPictureIcon from '@/assets/icons/big-picture-icon.svg';
import SembleLogo from '@/assets/semble-logo.svg';

export default function Home() {
  return (
    <BackgroundImage src={BG.src} h={'100svh'}>
      <Center h={'100svh'} py={{ base: '2rem', xs: '5rem' }}>
        <Container size={'xl'} p={'md'} my={'auto'}>
          <Stack align="center" gap={'5rem'}>
            <Stack gap={'xs'} align="center" maw={550} mx={'auto'}>
              <Image src={SembleLogo.src} alt="Semble logo" w={'auto'} h={60} />
              <Title order={1} fw={600} fz={'3rem'} ta={'center'}>
                A social knowledge network for researchers
              </Title>
              <Title order={2} fw={600} fz={'xl'} c={'#1F6144'} ta={'center'}>
                Follow your peers’ research trails. Surface and discover new
                connections. Built on ATProto so you own your data.
              </Title>
              {process.env.VERCEL_ENV === 'production' ? (
                <Button
                  component="a"
                  href="https://forms.cosmik.network/waitlist"
                  target="_blank"
                  size="lg"
                  color="dark"
                  mt={'lg'}
                >
                  Join waitlist
                </Button>
              ) : (
                <Group gap="md" mt={'lg'}>
                  <Button component="a" href="/signup" size="lg">
                    Sign up
                  </Button>

                  <Button
                    component="a"
                    href="/login"
                    size="lg"
                    color="dark"
                    rightSection={<BiRightArrowAlt size={22} />}
                  >
                    Log in
                  </Button>
                </Group>
              )}
            </Stack>

            <SimpleGrid
              cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 4 }}
              spacing={{ base: 'xl' }}
              mt={{ base: '1rem', xs: '5rem' }}
            >
              <Stack gap={'xs'}>
                <Image src={CurateIcon.src} alt="Curate icon" w={28} />
                <Text>
                  <Text fw={600} fz={'lg'} span>
                    Curate your research trails.
                  </Text>{' '}
                  <Text fw={500} fz={'lg'} c={'dark.2'} span>
                    Collect interesting links, add notes, and organize them into
                    shareable collections. Build trails others can explore and
                    extend.
                  </Text>
                </Text>
              </Stack>
              <Stack gap={'xs'}>
                <Image src={CommunityIcon.src} alt="Community icon" w={28} />
                <Text>
                  <Text fw={600} fz={'lg'} span>
                    Connect with peers.
                  </Text>{' '}
                  <Text fw={500} fz={'lg'} c={'dark.2'} span>
                    See what your peers are sharing and find new collaborators
                    with shared interests. Experience research rabbit holes,
                    together.
                  </Text>
                </Text>
              </Stack>
              <Stack gap={'xs'}>
                <Image src={DBIcon.src} alt="Database icon" w={28} />
                <Text>
                  <Text fw={600} fz={'lg'} span>
                    Own your data.
                  </Text>{' '}
                  <Text fw={500} fz={'lg'} c={'dark.2'} span>
                    Built on ATProto, new apps will come to you. No more
                    rebuilding your social graph and data when apps pivot and
                    shut down.
                  </Text>
                </Text>
              </Stack>
              <Stack gap={'xs'}>
                <Image src={BigPictureIcon.src} alt="Big picture icon" w={28} />
                <Text>
                  <Text fw={600} fz={'lg'} span>
                    See the bigger picture.
                  </Text>{' '}
                  <Text fw={500} fz={'lg'} c={'dark.2'} span>
                    Find relevant research based on your network. Get the extra
                    context that matters before you dive into a long read.
                  </Text>
                </Text>
              </Stack>
            </SimpleGrid>

            <Box
              component="footer"
              px={'md'}
              py={'xs'}
              mt={'xl'}
              pos={'relative'}
            >
              <Stack align="center" gap={'xs'}>
                <Group gap="0">
                  <ActionIcon
                    component="a"
                    href="https://bsky.app/profile/cosmik.network"
                    target="_blank"
                    variant="subtle"
                    color={'dark.2'}
                    radius={'xl'}
                    size={'xl'}
                    m={0}
                  >
                    <FaBluesky size={22} />
                  </ActionIcon>
                  <ActionIcon
                    component="a"
                    href="https://github.com/cosmik-network"
                    target="_blank"
                    variant="subtle"
                    color={'dark.2'}
                    radius={'xl'}
                    size={'xl'}
                  >
                    <FaGithub size={22} />
                  </ActionIcon>
                  <ActionIcon
                    component="a"
                    href="https://discord.gg/SHvvysb73e"
                    target="_blank"
                    variant="subtle"
                    color={'dark.2'}
                    radius={'xl'}
                    size={'xl'}
                  >
                    <FaDiscord size={22} />
                  </ActionIcon>
                </Group>
                <Button
                  component="a"
                  href="https://blog.cosmik.network"
                  target="_blank"
                  variant="light"
                  color="dark.1"
                  fw={600}
                  rightSection={<RiArrowRightUpLine />}
                >
                  Follow our blog for updates
                </Button>
                <Text c="dark.1" fw={600} ta="center">
                  Made by &nbsp;
                  <Anchor
                    href="https://cosmik.network/"
                    target="_blank"
                    style={{ verticalAlign: 'middle' }}
                  >
                    <Box
                      component="span"
                      display="inline-flex"
                      style={{ verticalAlign: 'middle' }}
                    >
                      <Image
                        src={CosmikLogo.src}
                        alt="Cosmik logo"
                        w={92}
                        h={28.4}
                      />
                    </Box>
                  </Anchor>
                  &nbsp;&nbsp;
                  <Text c="dark.1" fw={600} span>
                    with support from&nbsp;
                    <Anchor
                      href="https://www.openphilanthropy.org/"
                      target="_blank"
                      c="dark.2"
                      fw={600}
                    >
                      Open Philanthropy
                    </Anchor>{' '}
                    and{' '}
                    <Anchor
                      href="https://astera.org/"
                      target="_blank"
                      c="dark.2"
                      fw={600}
                    >
                      Astera
                    </Anchor>
                  </Text>
                </Text>
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Center>
    </BackgroundImage>
  );
}
