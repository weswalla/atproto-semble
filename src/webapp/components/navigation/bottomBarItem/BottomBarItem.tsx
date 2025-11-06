import { IconType } from 'react-icons/lib';
import { ActionIcon } from '@mantine/core';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ReactElement, isValidElement } from 'react';
import { useColorScheme } from '@mantine/hooks';

interface Props {
  href: string;
  icon: IconType | ReactElement;
}

export default function BottomBarItem(props: Props) {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const isActive = pathname === props.href;

  const renderIcon = () => {
    // If the icon is already a React element, just return it
    if (isValidElement(props.icon)) return props.icon;

    // Otherwise, it's an IconType component, so render it manually
    const IconComponent = props.icon as IconType;
    return <IconComponent size={22} />;
  };

  return (
    <ActionIcon
      component={Link}
      href={props.href}
      variant={isActive ? 'light' : 'transparent'}
      size={'lg'}
      color="gray"
    >
      {renderIcon()}
    </ActionIcon>
  );
}
