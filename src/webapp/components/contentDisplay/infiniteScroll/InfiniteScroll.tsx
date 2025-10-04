'use client';

import { ReactNode, useEffect, startTransition, useRef } from 'react';
import { Center, Button, Stack } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref, entry } = useIntersection({
    root: containerRef.current,
    threshold: 0,
  });

  useEffect(() => {
    startTransition(() => {
      if (entry?.isIntersecting && props.hasMore && !props.isLoading) {
        props.loadMore();
      }
    });
  }, [entry?.isIntersecting, props.hasMore, props.isLoading, props.loadMore]);

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
