"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/api";
import { getAccessToken } from "@/services/auth";
import { ApiClient } from "@/api-client/ApiClient";
import { UrlCard } from "@/components/UrlCard";
import type { GetMyUrlCardsResponse } from "@/api-client/types";
import {
  Button,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Title,
  Text,
} from "@mantine/core";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [urlCards, setUrlCards] = useState<GetMyUrlCardsResponse["cards"]>([]);
  const [loading, setLoading] = useState(true);
  const [cardsLoading, setCardsLoading] = useState(true);
  const router = useRouter();

  // Create API client instance
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000",
    () => getAccessToken(),
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accessToken = getAccessToken();

        // Fetch user data
        const userData = await authService.getCurrentUser(accessToken!);
        setUser(userData);

        // Fetch URL cards
        setCardsLoading(true);
        const cardsResponse = await apiClient.getMyUrlCards({ limit: 10 });
        setUrlCards(cardsResponse.cards);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
        setCardsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <div>
      {/* Recent Cards Section */}
      <Stack>
        <Group justify="space-between">
          <Title order={1}>Recent Cards</Title>
          <Button variant="outline" onClick={() => router.push("/cards")}>
            View All Cards
          </Button>
        </Group>

        {cardsLoading ? (
          <Loader />
        ) : urlCards.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={"md"}>
            {urlCards.map((card) => (
              <UrlCard
                key={card.id}
                cardId={card.id}
                url={card.url}
                title={card.cardContent.title}
                description={card.cardContent.description}
                author={card.cardContent.author}
                imageUrl={card.cardContent.thumbnailUrl}
                addedAt={card.createdAt}
                note={card.note?.text}
              />
            ))}
          </SimpleGrid>
        ) : (
          <Stack align="center" gap={"xs"}>
            <Text c={"grey"}>No cards yet</Text>
            <Button onClick={() => router.push("/cards/add")}>
              Add Your First Card
            </Button>
          </Stack>
        )}
      </Stack>
    </div>
  );
}
