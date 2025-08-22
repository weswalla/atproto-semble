import { Anchor, Text } from '@mantine/core';
import Link from 'next/link';

export default function Page() {
  return (
    <Text>
      Under construction. Check{' '}
      <Anchor component={Link} href={'/my-cards'}>
        My Cards
      </Anchor>{' '}
      in the meantime
    </Text>
  );
}
