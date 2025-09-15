import {
  ActionIcon,
  Affix,
  Text,
  Menu,
  Stack,
  Transition,
  Card,
  Overlay,
} from '@mantine/core';
import { Fragment, useEffect, useState } from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import { FaRegNoteSticky } from 'react-icons/fa6';
import { BiCollection } from 'react-icons/bi';
import { DEFAULT_OVERLAY_PROPS } from '@/styles/overlays';
import AddCardDrawer from '@/features/cards/components/addCardDrawer/AddCardDrawer';
import CreateCollectionDrawer from '@/features/collections/components/createCollectionDrawer/CreateCollectionDrawer';
import { useMediaQuery } from '@mantine/hooks';
import { useNavbarContext } from '@/providers/navbar';

export default function ComposerDrawer() {
  const { mobileOpened, desktopOpened } = useNavbarContext();
  const isDesktop = useMediaQuery('(min-width: 36em)'); // "sm" breakpoint
  const isNavOpen = isDesktop ? desktopOpened : mobileOpened;
  const shouldShowFab = !isNavOpen;
  const [opened, setOpened] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<
    'addCard' | 'createCollection' | null
  >();

  // reset composer state when FAB due to breakpoint change
  useEffect(() => {
    if (!shouldShowFab) {
      setOpened(false);
    }
  }, [shouldShowFab]);

  return (
    <Fragment>
      {shouldShowFab && (
        <Menu
          opened={opened}
          onChange={setOpened}
          position="left-end"
          transitionProps={{ transition: 'fade-left', enterDelay: 50 }}
          radius="lg"
        >
          <Menu.Target>
            <Affix m="xs" style={{ zIndex: 102 }}>
              <ActionIcon size="input-xl" radius="xl" variant="filled" h="100%">
                <Transition
                  mounted={!opened}
                  transition="fade-left"
                  duration={200}
                  timingFunction="ease"
                >
                  {(styles) => (
                    <FiPlus
                      size={30}
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
                    <FiX
                      size={30}
                      style={{ ...styles, position: 'absolute' }}
                    />
                  )}
                </Transition>
              </ActionIcon>
            </Affix>
          </Menu.Target>

          <Menu.Dropdown
            bg="transparent"
            style={{
              display: 'flex',
              flexDirection: 'row',
              border: 0,
              gap: 12,
            }}
            py={0}
          >
            <Menu.Item
              onClick={() => setActiveDrawer('addCard')}
              p={0}
              style={{ cursor: 'pointer' }}
            >
              <Card withBorder shadow="xl" radius="lg">
                <Stack gap="xs" c="gray">
                  <FaRegNoteSticky size={22} />
                  <Text fw={600}>
                    New <br />
                    Card
                  </Text>
                </Stack>
              </Card>
            </Menu.Item>

            <Menu.Item
              onClick={() => setActiveDrawer('createCollection')}
              p={0}
              style={{ cursor: 'pointer' }}
            >
              <Card withBorder shadow="xl" radius="lg">
                <Stack gap="xs" c="gray">
                  <BiCollection size={22} />
                  <Text fw={600}>New Collection</Text>
                </Stack>
              </Card>
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      )}

      <AddCardDrawer
        isOpen={activeDrawer === 'addCard'}
        onClose={() => setActiveDrawer(null)}
      />
      <CreateCollectionDrawer
        isOpen={activeDrawer === 'createCollection'}
        onClose={() => setActiveDrawer(null)}
      />

      <Transition
        mounted={shouldShowFab && opened}
        transition="fade"
        duration={200}
        timingFunction="ease"
      >
        {(styles) => (
          <Overlay
            fixed={true}
            blur={DEFAULT_OVERLAY_PROPS.blur}
            gradient={DEFAULT_OVERLAY_PROPS.gradient}
            inset={DEFAULT_OVERLAY_PROPS.inset}
            style={{
              ...styles,
              zIndex: 101,
            }}
          />
        )}
      </Transition>
    </Fragment>
  );
}
