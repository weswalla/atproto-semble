"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, Center, Loader, Stack, Title, Text } from "@mantine/core";

function AuthCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const error = searchParams.get("error");

    // Clear the URL parameters for security
    const cleanUrl = "/";
    window.history.replaceState({}, document.title, cleanUrl);

    if (error) {
      console.error("Authentication error:", error);
      router.push(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (accessToken && refreshToken) {
      // Store tokens using the auth context function
      setTokens(accessToken, refreshToken);

      // Redirect to dashboard or home page
      router.push("/library");
    } else {
      router.push("/login?error=Authentication failed");
    }
  }, [router, searchParams, setTokens]);

  return (
    <Stack align="center">
      <Stack gap={0} align="center">
        <Title order={2}>Completing Sign In</Title>
        <Text>Please wait while we complete your authentication...</Text>
      </Stack>
      <Loader type="bars" />
    </Stack>
  );
}

export default function AuthCompletePage() {
  return (
    <Center h={"100svh"}>
      <Suspense
        fallback={
          <Card>
            <Stack align="center">
              <Title order={2}>Loading</Title>
              <Loader />
            </Stack>
          </Card>
        }
      >
        <AuthCompleteContent />
      </Suspense>
    </Center>
  );
}
