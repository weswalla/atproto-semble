"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/services/auth";
import { ApiClient } from "@/api-client/ApiClient";
import {
  Stack,
  Title,
  Text,
  Container,
  Card,
  Button,
  TextInput,
  Textarea,
  Group,
  Alert,
} from "@mantine/core";
import { useForm } from "@mantine/form";

export default function CreateCollectionPage() {
  const form = useForm({
    initialValues: {
      name: "",
      description: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Create API client instance
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000",
    () => getAccessToken(),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.getValues().name.trim()) {
      setError("Collection name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiClient.createCollection({
        name: form.getValues().name.trim(),
        description: form.getValues().description.trim() || undefined,
      });

      // Redirect to collections page on success
      router.push("/collections");
    } catch (error: any) {
      console.error("Error creating collection:", error);
      setError(
        error.message || "Failed to create collection. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Stack>
        <Stack gap={0}>
          <Title order={1}>Create Collection</Title>
          <Text c={"gray"}>
            Create a new collection to organize your cards.
          </Text>
        </Stack>

        <Card withBorder>
          <Stack>
            <Title order={3}>Collection Details</Title>

            <Stack>
              <form onSubmit={handleSubmit}>
                <Stack>
                  <Stack>
                    <TextInput
                      id="name"
                      label="Name"
                      type="text"
                      placeholder="Enter collection name"
                      disabled={loading}
                      required
                      maxLength={100}
                      key={form.key("name")}
                      {...form.getInputProps("name")}
                    />

                    <Textarea
                      id="description"
                      label="Description"
                      placeholder="Describe what this collection is about..."
                      disabled={loading}
                      rows={3}
                      maxLength={500}
                      key={form.key("description")}
                      {...form.getInputProps("description")}
                    />
                  </Stack>

                  {error && <Alert color="red" title={error} />}

                  <Group>
                    <Button type="submit" loading={loading}>
                      {loading ? "Creating..." : "Create Collection"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
