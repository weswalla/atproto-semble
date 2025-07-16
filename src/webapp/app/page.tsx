"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Title, Text, Stack, Button } from "@mantine/core";
import { FaBluesky } from "react-icons/fa6";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/library");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Stack align="center">
        <Stack align="center" gap={0}>
          <Title order={1}>Welcome to Annos</Title>
          <Text fw={600} fz={"xl"} c={"dark.4"}>
            Your annotation platform
          </Text>
        </Stack>

        <Stack align="center">
          <Text fw={500} c={"gray"}>
            Please sign in to access your annotations
          </Text>
          <Button component="a" href="/login" leftSection={<FaBluesky />}>
            Sign in with Bluesky
          </Button>
        </Stack>
      </Stack>
    </main>
  );
}
