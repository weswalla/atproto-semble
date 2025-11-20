import type { IconType } from 'react-icons/lib';
import { Button } from '@mantine/core';
import Link from 'next/link';
import { isValidElement } from 'react';

interface Props {
  href: string;
  icon: IconType | React.ReactElement;
  children: React.ReactNode;
}
export default function SettingItem(props: Props) {
  const renderIcon = () => {
    if (isValidElement(props.icon)) return props.icon;

    const IconComponent = props.icon as IconType;
    return <IconComponent size={22} />;
  };

  return (
    <Button
      component={Link}
      href={props.href}
      variant="default"
      size="md"
      justify="start"
      radius={'lg'}
      c="gray"
      leftSection={renderIcon()}
    >
      {props.children}
    </Button>
  );
}
