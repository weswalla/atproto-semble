"use client";

import { useState } from "react";
import { BiPlus, BiLinkExternal } from "react-icons/bi";
import { AddToCollectionModal } from "./AddToCollectionModal";
import {
  ActionIcon,
  Blockquote,
  Card,
  Group,
  Image,
  Stack,
  Text,
} from "@mantine/core";

interface UrlCardProps {
  cardId: string;
  url: string;
  title?: string;
  description?: string;
  author?: string;
  siteName?: string;
  imageUrl?: string;
  addedAt: string;
  note?: string;
}

export function UrlCard({
  cardId,
  url,
  title,
  description,
  author,
  siteName,
  imageUrl,
  addedAt,
  note,
}: UrlCardProps) {
  const [showAddToCollectionModal, setShowAddToCollectionModal] =
    useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const handleAddToCollectionSuccess = () => {
    // Could show a toast notification here
    console.log("Card added to collection(s) successfully");
  };

  return (
    <>
      <Card withBorder>
        <Stack>
          <Group wrap="nowrap">
            <Stack gap={0}>
              <Text fw={600} lineClamp={1}>
                {title || getDomain(url)}
              </Text>
              <Text fz={"sm"} fw={500} lineClamp={1} c={"gray"}>
                {getDomain(url)} • {formatDate(addedAt)}
              </Text>
            </Stack>
            <Group wrap="nowrap">
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={title || "Card image"}
                  w={64}
                  h={64}
                  radius={"md"}
                />
              )}
            </Group>
            <Stack gap={"xs"}>
              <ActionIcon
                variant="transparent"
                onClick={() => setShowAddToCollectionModal(true)}
                title="Add to collection"
              >
                <BiPlus />
              </ActionIcon>
              <ActionIcon
                variant="transparent"
                onClick={() => window.open(url, "_blank")}
                title="Open link"
              >
                <BiLinkExternal />
              </ActionIcon>
            </Stack>
          </Group>

          <Stack>
            {description && (
              <Text lineClamp={2} fz={"sm"}>
                {description}
              </Text>
            )}
            {author && (
              <Text fw={500} fz={"xs"} c={"gray"}>
                By {author}
              </Text>
            )}
            {note && (
              <Blockquote color="yellow" p={"xs"} fz={"sm"}>
                {note}
              </Blockquote>
            )}
          </Stack>
        </Stack>
      </Card>

      <AddToCollectionModal
        cardId={cardId}
        isOpen={showAddToCollectionModal}
        onClose={() => setShowAddToCollectionModal(false)}
        onSuccess={handleAddToCollectionSuccess}
      />
    </>
  );
}
