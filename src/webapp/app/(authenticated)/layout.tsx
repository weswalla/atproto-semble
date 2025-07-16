"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDisclosure } from "@mantine/hooks";
import { AppShell, Burger, Group, NavLink, Text } from "@mantine/core";
import { IoDocumentTextOutline } from "react-icons/io5";
import { BsFolder2 } from "react-icons/bs";
import { BiUser } from "react-icons/bi";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  const pathname = usePathname();

  useEffect(() => {
    // Check if user is authenticated
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger
            opened={mobileOpened}
            onClick={toggleMobile}
            hiddenFrom="sm"
            size="sm"
          />
          <Burger
            opened={desktopOpened}
            onClick={toggleDesktop}
            visibleFrom="sm"
            size="sm"
          />
          <Text>Annos</Text>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <NavLink
          href="/library"
          label="My cards"
          active={pathname === "/library"}
          leftSection={<IoDocumentTextOutline />}
        />
        <NavLink
          href="/collections"
          label="My collections"
          active={pathname === "/collections"}
          leftSection={<BsFolder2 />}
        />
        <NavLink
          href="/profile"
          label="Profile"
          active={pathname === "/profile"}
          leftSection={<BiUser />}
          mt={"auto"}
        />
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
