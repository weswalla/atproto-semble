import { ActionIcon, Affix } from '@mantine/core';
import { Fragment, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import AddCardDrawer from '@/features/cards/components/addCardDrawer/AddCardDrawer';
import { useMediaQuery } from '@mantine/hooks';
import { useNavbarContext } from '@/providers/navbar';

export default function ComposerDrawer() {
  const { mobileOpened, desktopOpened } = useNavbarContext();
  const isDesktop = useMediaQuery('(min-width: 36em)'); // "sm" breakpoint
  const isNavOpen = isDesktop ? desktopOpened : mobileOpened;
  const shouldShowFab = !isNavOpen;
  const [opened, setOpened] = useState(false);

  return (
    <Fragment key={shouldShowFab.toString()}>
      {shouldShowFab && (
        <Affix
          mt={'md'}
          mx={'xs'}
          mb={{ base: 80, sm: 'md' }}
          style={{ zIndex: 102 }}
        >
          <ActionIcon
            size="input-xl"
            radius="xl"
            variant="filled"
            onClick={() => setOpened((prev) => !prev)}
          >
            <FiPlus size={30} />
          </ActionIcon>
        </Affix>
      )}

      <AddCardDrawer isOpen={opened} onClose={() => setOpened(false)} />
    </Fragment>
  );
}
