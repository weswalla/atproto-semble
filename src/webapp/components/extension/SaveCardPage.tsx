import { useState, useEffect } from "react";
import { useExtensionAuth } from "../../hooks/useExtensionAuth";
import { ApiClient } from "../../api-client/ApiClient";
import { IoMdCheckmark } from "react-icons/io";
import {
  Alert,
  AspectRatio,
  Box,
  Button,
  Divider,
  Group,
  Image,
  Loader,
  Paper,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";

interface UrlMetadata {
  url: string;
  title?: string;
  description?: string;
  author?: string;
  siteName?: string;
  imageUrl?: string;
  type?: string;
}

export function SaveCardPage() {
  const { logout, accessToken } = useExtensionAuth();
  const [currentUrl, setCurrentUrl] = useState("");
  const [metadata, setMetadata] = useState<UrlMetadata | null>(null);
  const [note, setNote] = useState("");
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const apiClient = new ApiClient(
    process.env.PLASMO_PUBLIC_API_URL || "http://localhost:3000",
    () => accessToken,
  );

  // Get current tab URL and fetch metadata when popup opens
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        console.log("Tab info:", tabs[0]); // Debug log

        if (tabs[0]) {
          const tab = tabs[0];

          if (tab.url) {
            const url = tab.url;
            setCurrentUrl(url);

            // Fetch metadata for the current URL
            setIsLoadingMetadata(true);
            try {
              const urlMetadata = await apiClient.getUrlMetadata(url);
              setMetadata(urlMetadata.metadata);
            } catch (error) {
              console.error("Failed to fetch URL metadata:", error);
              setError("Failed to load page information");
            } finally {
              setIsLoadingMetadata(false);
            }
          } else {
            console.error("No URL found in tab:", tab);
            setError(
              "Cannot access this page's URL. Make sure the extension has proper permissions.",
            );
          }
        } else {
          console.error("No active tab found");
          setError("No active tab found");
        }
      });
    } else {
      console.error("Chrome tabs API not available");
      setError("Extension API not available");
    }
  }, []);

  const handleSaveCard = async () => {
    if (!currentUrl) return;

    setIsSaving(true);
    setError("");

    try {
      await apiClient.addUrlToLibrary({
        url: currentUrl,
        note: note.trim() || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        window.close(); // Close the popup after successful save
      }, 1500);
    } catch (error: any) {
      console.error("Error saving card:", error);
      setError(error.message || "Failed to save card. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (success) {
    return (
      <Stack align="center" gap={"xs"} c={"green"}>
        <IoMdCheckmark size={20} />
        <Text fw={500} c={"gray"}>
          Card saved successfully!
        </Text>
      </Stack>
    );
  }

  return (
    <Box>
      <Stack>
        <Group justify="space-between">
          <Title order={1} fz={"xl"}>
            Save Card
          </Title>
          <Button variant="subtle" color={"gray"} onClick={logout}>
            Sign out
          </Button>
        </Group>

        <Divider />

        {/* URL Metadata Display */}
        {isLoadingMetadata ? (
          <Stack gap={0} align="center">
            <Loader type="dots" size={"sm"} />
            <Text fz={"sm"} fw={500} c={"gray"}>
              Loading page information...
            </Text>
          </Stack>
        ) : metadata ? (
          <Paper bg={"gray.2"} p={"sm"}>
            <Stack>
              {metadata.imageUrl && (
                <AspectRatio ratio={2 / 1}>
                  <Image
                    src={metadata.imageUrl}
                    alt={metadata.title || "Page preview"}
                  />
                </AspectRatio>
              )}
              <Stack gap={"xs"}>
                <Stack gap={"0"}>
                  <Title order={3} lineClamp={2} fz={"md"} fw={500}>
                    {metadata.title || "Untitled"}
                  </Title>
                  {metadata.description && (
                    <Text fz={"sm"} fw={500} c={"gray"} lineClamp={2}>
                      {metadata.description}
                    </Text>
                  )}
                </Stack>
                <Text fz={"xs"} c={"gray"}>
                  {metadata.siteName || new URL(currentUrl).hostname}
                </Text>
              </Stack>
            </Stack>
          </Paper>
        ) : (
          <Stack gap={0}>
            <Text fz={"sm"} c={"gray"}>
              Current page:
            </Text>
            <Text fz={"sm"} truncate={"end"}>
              {currentUrl || "Loading..."}
            </Text>
          </Stack>
        )}

        {/* Note Input */}
        <Textarea
          label="Note (optional)"
          placeholder="Add a note about this page..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          disabled={isSaving}
        />

        {/* Error Display */}
        {error && <Alert color={"red"} title={error} />}

        {/* Action Buttons */}
        <Stack gap={"xs"}>
          <Button
            onClick={handleSaveCard}
            disabled={!currentUrl || isSaving}
            loading={isSaving}
          >
            {isSaving ? "Saving..." : "Save Card"}
          </Button>

          <Button
            variant="subtle"
            onClick={() => window.close()}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
