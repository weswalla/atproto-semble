import { Button } from '@mantine/core';
import { BiSolidLeftArrowAlt } from 'react-icons/bi';
import Link from 'next/link';

interface Props {
  href: string;
  children: string;
}

export default function BackButton(props: Props) {
  return (
    <Button
      component={Link}
      href={props.href}
      variant="light"
      size="xs"
      color="gray"
      leftSection={<BiSolidLeftArrowAlt />}
    >
      {props.children}
    </Button>
  );
}
