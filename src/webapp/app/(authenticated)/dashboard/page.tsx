"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/api";
import { getAccessToken, clearAuth } from "@/services/auth";
import { ApiClient } from "@/api-client/ApiClient";
import { UrlCard } from "@/components/UrlCard";
import type { GetMyUrlCardsResponse } from "@/api-client/types";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [urlCards, setUrlCards] = useState<GetMyUrlCardsResponse["cards"]>([]);
  const [loading, setLoading] = useState(true);
  const [cardsLoading, setCardsLoading] = useState(true);
  const router = useRouter();

  // Create API client instance
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000",
    () => getAccessToken()
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

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Clear auth tokens regardless of API success
      clearAuth();
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={handleLogout} variant="outline">
          Sign Out
        </Button>
      </div>

      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Welcome back!</h2>
          {user && (
            <div className="text-sm text-gray-600">
              <p>
                <strong>Handle:</strong> {user.handle}
              </p>
              <p>
                <strong>DID:</strong> {user.did}
              </p>
            </div>
          )}
        </div>

        {/* Recent Cards Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Recent Cards</h2>
            <Button variant="outline" onClick={() => router.push("/cards")}>
              View All Cards
            </Button>
          </div>

          {cardsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : urlCards.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">No cards yet</p>
              <Button onClick={() => router.push("/cards")}>
                Add Your First Card
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
