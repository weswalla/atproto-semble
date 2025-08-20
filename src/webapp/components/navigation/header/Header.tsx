import { ActionIcon, AppShellHeader, Group, Image } from '@mantine/core';
import SembleLogo from '@/assets/semble-logo.svg';
import { FiSidebar } from 'react-icons/fi';

interface Props {
  onToggleNavbar: () => void;
}

export default function Header(props: Props) {
  return (
    <AppShellHeader withBorder={false}>
      <Group h="100%" px="md" gap={'xs'} justify="space-between">
        <Group>
          <Image
            src={SembleLogo.src}
            alt="Semble logo"
            w={'auto'}
            h={28}
            ml={'xs'}
          />
          <ActionIcon
            variant="subtle"
            color="gray"
            size={'lg'}
            radius={'xl'}
            onClick={props.onToggleNavbar}
          >
            <FiSidebar size={22} />
          </ActionIcon>
        </Group>
      </Group>
    </AppShellHeader>
  );
}
