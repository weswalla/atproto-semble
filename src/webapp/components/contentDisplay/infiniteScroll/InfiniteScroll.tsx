'use client';

import { ReactNode, useEffect, startTransition } from 'react';
import { Center, Button, Stack } from '@mantine/core';
import { useInViewport } from '@mantine/hooks';

interface Props {
  children: ReactNode;
  dataLength: number;
  hasMore: boolean;
  isInitialLoading: boolean;
  isLoading: boolean;
  loadMore: () => void;
  loader?: ReactNode;
  manualLoadButton?: boolean;
}

export default function InfiniteScroll(props: Props) {
  const { ref, inViewport } = useInViewport();

  useEffect(() => {
    startTransition(() => {
      if (inViewport && props.hasMore && !props.isLoading) {
        props.loadMore();
      }
    });
  }, [inViewport, props.hasMore, props.isLoading, props.loadMore]);

  return (
    <Stack>
      {props.children}
      {props.isLoading && props.loader}

      <Center ref={ref}>
        {!props.isLoading && props.hasMore && props.manualLoadButton && (
          <Button loading={props.isLoading} onClick={props.loadMore}>
            Load more
          </Button>
        )}
      </Center>
    </Stack>
  );
}
