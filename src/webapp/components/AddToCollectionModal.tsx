"use client";

import { useState, useEffect } from "react";
import { getAccessToken } from "@/services/auth";
import { ApiClient } from "@/api-client/ApiClient";
import type { GetMyCollectionsResponse } from "@/api-client/types";
import {
  Box,
  Button,
  Center,
  Checkbox,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";

interface AddToCollectionModalProps {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddToCollectionModal({
  cardId,
  isOpen,
  onClose,
  onSuccess,
}: AddToCollectionModalProps) {
  const [collections, setCollections] = useState<
    GetMyCollectionsResponse["collections"]
  >([]);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Create API client instance
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000",
    () => getAccessToken(),
  );

  useEffect(() => {
    if (isOpen) {
      fetchCollections();
    }
  }, [isOpen]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.getMyCollections({ limit: 100 });
      setCollections(response.collections);
    } catch (error: any) {
      console.error("Error fetching collections:", error);
      setError(error.message || "Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionToggle = (collectionId: string) => {
    const newSelected = new Set(selectedCollections);
    if (newSelected.has(collectionId)) {
      newSelected.delete(collectionId);
    } else {
      newSelected.add(collectionId);
    }
    setSelectedCollections(newSelected);
  };

  const handleSubmit = async () => {
    if (selectedCollections.size === 0) {
      setError("Please select at least one collection");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Add card to all selected collections in a single request
      await apiClient.addCardToCollection({
        cardId,
        collectionIds: Array.from(selectedCollections),
      });

      // Success
      onSuccess?.();
      onClose();
      setSelectedCollections(new Set());
    } catch (error: any) {
      console.error("Error adding card to collections:", error);
      setError(error.message || "Failed to add card to collections");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
      setSelectedCollections(new Set());
      setError("");
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="Add to Collections"
      centered
    >
      <Stack p={"sm"}>
        {loading ? (
          <Center>
            <Loader />
          </Center>
        ) : error && collections.length === 0 ? (
          <Stack align="center">
            <Text c={"red"}>{error}</Text>
            <Button onClick={fetchCollections} variant="outline" size="sm">
              Try Again
            </Button>
          </Stack>
        ) : collections.length === 0 ? (
          <Stack align="center">
            <Text c={"red"}>No collections found</Text>
            <Button
              onClick={() => window.open("/collections/create", "_blank")}
              variant="outline"
              size="sm"
            >
              Create Collection
            </Button>
          </Stack>
        ) : (
          <Box>
            <ScrollArea h={250}>
              {collections.map((collection) => (
                <Group key={collection.id}>
                  <Checkbox
                    id={collection.id}
                    checked={selectedCollections.has(collection.id)}
                    onChange={() => handleCollectionToggle(collection.id)}
                    disabled={submitting}
                  />

                  <Stack gap={"0"}>
                    <Text fw={500}>{collection.name}</Text>
                    {collection.description && (
                      <Text fz={"sm"} fw={500} c={"gray"} truncate="end">
                        {collection.description}
                      </Text>
                    )}
                    <Text fz={"sm"} fw={500} c={"gray.5"}>
                      {collection.cardCount} cards
                    </Text>
                  </Stack>
                </Group>
              ))}
            </ScrollArea>

            {error && <Text c={"red"}>{error}</Text>}

            <Group grow>
              <Button
                onClick={handleSubmit}
                disabled={submitting || selectedCollections.size === 0}
                loading={submitting}
              >
                {submitting
                  ? "Adding..."
                  : `Add to ${selectedCollections.size} Collection${selectedCollections.size !== 1 ? "s" : ""}`}
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={submitting}
              >
                Cancel
              </Button>
            </Group>
          </Box>
        )}
      </Stack>
    </Modal>
  );
}
