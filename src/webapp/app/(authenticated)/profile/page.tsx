"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  Card,
  Code,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { getAccessToken } from "@/services/auth";
import { ApiClient } from "@/api-client/ApiClient";
import type { GetMyProfileResponse } from "@/api-client/types";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const [profile, setProfile] = useState<GetMyProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const { logout } = useAuth();

  // Create API client instance
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000",
    () => getAccessToken(),
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getMyProfile();
        setProfile(response);
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        setError(error.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (error || !profile) {
    return (
      <Stack align="center">
        <Text fw={500}>{error || "Failed to load profile"}</Text>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </Stack>
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={1}>Profile</Title>
        <Button color="red" onClick={handleLogout}>
          Logout
        </Button>
      </Group>

      {/* Profile Information */}
      <Card withBorder>
        <Stack>
          <Group>
            {profile.avatarUrl && (
              <Avatar
                src={profile.avatarUrl}
                alt={`${profile.name}'s avatar`}
                w={64}
                h={64}
              />
            )}
            <div>
              <Title order={2}>{profile.name}</Title>
              <Text fw={500} c="gray">
                @{profile.handle}
              </Text>
            </div>
          </Group>
          {profile.description && <Text>{profile.description}</Text>}
        </Stack>
      </Card>

      {/* Profile Details */}
      <Card withBorder>
        <Stack>
          <Title order={3}>Account Details</Title>

          <Stack>
            <div>
              <Text fw={500} fz={"sm"} c={"gray"}>
                User ID
              </Text>
              <Code bg={"gray.1"} p={"sm"}>
                {profile.id}
              </Code>
            </div>
            <div>
              <Text fw={500} fz={"sm"} c={"gray"}>
                Handle
              </Text>
              <Text fz={"sm"}>@{profile.handle}</Text>
            </div>
            <div>
              <Text fw={500} fz={"sm"} c={"gray"}>
                Display Name
              </Text>
              <Text fz={"sm"}>{profile.name}</Text>
            </div>
            {profile.description && (
              <div>
                <Text fw={500} fz={"sm"} c={"gray"}>
                  Description
                </Text>
                <Text fz={"sm"}>{profile.description}</Text>
              </div>
            )}
          </Stack>
        </Stack>
      </Card>
    </Stack>
  );
}
