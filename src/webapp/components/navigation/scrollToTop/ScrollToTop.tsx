'use client';

import { useWindowScroll } from '@mantine/hooks';
import { ActionIcon, Transition } from '@mantine/core';
import { FaArrowUp } from 'react-icons/fa6';

export default function ScrollToTop() {
  const [scroll, scrollTo] = useWindowScroll();

  return (
    <Transition transition="slide-up" mounted={scroll.y > 100}>
      {(transitionStyles) => (
        <ActionIcon
          onClick={() => scrollTo({ y: 0 })}
          style={{ ...transitionStyles, zIndex: 102 }}
          radius={'xl'}
          variant="outline"
          size={'xl'}
          bg="white"
          color={'gray'}
          m="sm"
          pos={'fixed'}
          bottom={0}
          left={0}
        >
          <FaArrowUp size={22} />
        </ActionIcon>
      )}
    </Transition>
  );
}
