"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/services/auth";
import { ApiClient } from "@/api-client/ApiClient";
import {
  Box,
  Stack,
  Text,
  Title,
  Card,
  TextInput,
  Textarea,
  Button,
  Group,
} from "@mantine/core";
import { useForm } from "@mantine/form";

export default function AddCardPage() {
  const form = useForm({
    initialValues: {
      url: "",
      note: "",
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

    if (!form.getValues().url.trim()) {
      setError("URL is required");
      return;
    }

    // Basic URL validation
    try {
      new URL(form.getValues().url);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiClient.addUrlToLibrary({
        url: form.getValues().url.trim(),
        note: form.getValues().note.trim() || undefined,
      });

      // Redirect to dashboard or cards page on success
      router.push("/library");
    } catch (error: any) {
      console.error("Error adding card:", error);
      setError(error.message || "Failed to add card. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Stack>
        <Stack gap={0}>
          <Title order={1}>Add Card</Title>
          <Text c={"gray"}>
            Add a URL to your library with an optional note.
          </Text>
        </Stack>

        <Card withBorder>
          <Stack>
            <Title order={3}>Add URL to Library</Title>

            <Stack>
              <form onSubmit={handleSubmit}>
                <Stack>
                  <Stack>
                    <TextInput
                      id="url"
                      label="URL"
                      type="url"
                      placeholder="https://example.com"
                      disabled={loading}
                      required
                      key={form.key("url")}
                      {...form.getInputProps("url")}
                    />

                    <Textarea
                      id="note"
                      label="Note"
                      placeholder="Add a note about this URL..."
                      disabled={loading}
                      rows={3}
                      key={form.key("note")}
                      {...form.getInputProps("note")}
                    />
                  </Stack>

                  {error && <Text c={"red"}>{error}</Text>}

                  <Group>
                    <Button type="submit" loading={loading}>
                      {loading ? "Adding..." : "Add Card"}
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
    </Box>
  );
}
