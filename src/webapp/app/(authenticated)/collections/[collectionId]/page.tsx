"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getAccessToken } from "@/services/auth";
import { ApiClient } from "@/api-client/ApiClient";
import { UrlCard } from "@/components/UrlCard";
import type { GetCollectionPageResponse } from "@/api-client/types";

export default function CollectionPage() {
  const [collection, setCollection] = useState<GetCollectionPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useParams();
  const collectionId = params.collectionId as string;

  // Create API client instance
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000",
    () => getAccessToken()
  );

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getCollectionPage(collectionId, { limit: 50 });
        setCollection(response);
      } catch (error: any) {
        console.error("Error fetching collection:", error);
        setError(error.message || "Failed to load collection");
      } finally {
        setLoading(false);
      }
    };

    if (collectionId) {
      fetchCollection();
    }
  }, [collectionId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "Collection not found"}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <Button variant="outline" onClick={() => router.back()}>
          ← Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/collections/${collectionId}/edit`)}>
            Edit Collection
          </Button>
          <Button onClick={() => router.push("/cards/add")}>
            Add Card
          </Button>
        </div>
      </div>

      {/* Collection Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-3xl">{collection.name}</CardTitle>
                <Badge variant={collection.accessType === "OPEN" ? "default" : "secondary"}>
                  {collection.accessType}
                </Badge>
              </div>
              {collection.description && (
                <CardDescription className="text-base leading-relaxed">
                  {collection.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div>
              <span className="font-medium">{collection.cardCount}</span> cards
            </div>
            <div>
              Created {new Date(collection.createdAt).toLocaleDateString()}
            </div>
            {collection.collaboratorCount > 0 && (
              <div>
                <span className="font-medium">{collection.collaboratorCount}</span> collaborator{collection.collaboratorCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cards Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Cards</h2>
          {collection.pagination && collection.pagination.totalCount > 0 && (
            <p className="text-sm text-gray-500">
              Showing {collection.cards.length} of {collection.pagination.totalCount} cards
            </p>
          )}
        </div>

        {collection.cards.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {collection.cards.map((card) => (
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

            {/* Pagination */}
            {collection.pagination && collection.pagination.hasMore && (
              <div className="text-center mt-8">
                <Button variant="outline">
                  Load More Cards
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">No cards in this collection yet</p>
            <Button onClick={() => router.push("/cards/add")}>
              Add Your First Card
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
