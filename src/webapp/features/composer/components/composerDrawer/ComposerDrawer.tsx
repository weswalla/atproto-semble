import {
  ActionIcon,
  Affix,
  Text,
  Box,
  Menu,
  Stack,
  Transition,
  Card,
  AspectRatio,
} from '@mantine/core';
import { Fragment, useState } from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import { FaRegNoteSticky } from 'react-icons/fa6';
import { BiCollection } from 'react-icons/bi';
import Link from 'next/link';

export default function ComposerDrawer() {
  const [opened, setOpened] = useState(false);

  return (
    <Fragment>
      <Menu
        opened={opened}
        onChange={setOpened}
        position="left-end"
        transitionProps={{ transition: 'fade-left', enterDelay: 50 }}
      >
        <Menu.Target>
          <Affix m={'md'}>
            <ActionIcon
              size={'input-lg'}
              radius="xl"
              variant="filled"
              h={'100%'}
            >
              <Transition
                mounted={!opened}
                transition="fade-left"
                duration={200}
                timingFunction="ease"
              >
                {(styles) => (
                  <FiPlus
                    size={26}
                    style={{ ...styles, position: 'absolute' }}
                  />
                )}
              </Transition>
              <Transition
                mounted={opened}
                transition="fade-right"
                duration={200}
                timingFunction="ease"
              >
                {(styles) => (
                  <FiX size={26} style={{ ...styles, position: 'absolute' }} />
                )}
              </Transition>
            </ActionIcon>
          </Affix>
        </Menu.Target>
        <Menu.Dropdown
          bg={'transparent'}
          style={{
            display: 'flex',
            flexDirection: 'row',
            border: 0,
            gap: 12,
          }}
          py={0}
        >
          <Menu.Item component={Link} href="/cards/add" p={0}>
            <Card withBorder shadow="xl" radius={'lg'}>
              <Stack gap={'xs'} c={'gray'}>
                <FaRegNoteSticky size={22} />
                <Text fw={600}>
                  New <br />
                  Card
                </Text>
              </Stack>
            </Card>
          </Menu.Item>
          <Menu.Item component={Link} href="/collections/create" p={0}>
            <Card withBorder shadow="xl" radius={'lg'}>
              <Stack gap={'xs'} c={'gray'}>
                <BiCollection size={22} />
                <Text fw={600}>New Collection</Text>
              </Stack>
            </Card>
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <Transition
        mounted={opened}
        transition="fade"
        duration={200}
        timingFunction="ease"
      >
        {(styles) => (
          <Box
            style={{
              ...styles,
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              backdropFilter: 'blur(3px)',
              background:
                'linear-gradient(0deg, rgba(204, 255, 0, 0.5), rgba(255, 255, 255, 0.5))',
            }}
          />
        )}
      </Transition>
    </Fragment>
  );
}
