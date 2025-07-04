"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getAccessToken } from "@/services/auth";
import { ApiClient } from "@/api-client/ApiClient";
import type { GetUrlCardViewResponse } from "@/api-client/types";

export default function CardPage() {
  const [card, setCard] = useState<GetUrlCardViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useParams();
  const cardId = params.cardId as string;

  // Create API client instance
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000",
    () => getAccessToken()
  );

  useEffect(() => {
    const fetchCard = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getUrlCardView(cardId);
        setCard(response);
      } catch (error: any) {
        console.error("Error fetching card:", error);
        setError(error.message || "Failed to load card");
      } finally {
        setLoading(false);
      }
    };

    if (cardId) {
      fetchCard();
    }
  }, [cardId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "Card not found"}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <Button variant="outline" onClick={() => router.back()}>
          ← Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">
                {card.cardContent.title || "Untitled"}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Badge variant="secondary">{card.type}</Badge>
                <span>Added {new Date(card.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            {card.cardContent.thumbnailUrl && (
              <img
                src={card.cardContent.thumbnailUrl}
                alt={card.cardContent.title || "Card thumbnail"}
                className="w-32 h-20 object-cover rounded-md"
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* URL */}
          <div>
            <h3 className="font-semibold mb-2">URL</h3>
            <a
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline break-all"
            >
              {card.url}
            </a>
          </div>

          {/* Description */}
          {card.cardContent.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">
                {card.cardContent.description}
              </p>
            </div>
          )}

          {/* Author */}
          {card.cardContent.author && (
            <div>
              <h3 className="font-semibold mb-2">Author</h3>
              <p className="text-gray-700">{card.cardContent.author}</p>
            </div>
          )}

          {/* Site Name */}
          {card.cardContent.siteName && (
            <div>
              <h3 className="font-semibold mb-2">Site</h3>
              <p className="text-gray-700">{card.cardContent.siteName}</p>
            </div>
          )}

          {/* Note */}
          {card.note && (
            <div>
              <h3 className="font-semibold mb-2">Note</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-700 leading-relaxed">{card.note.text}</p>
              </div>
            </div>
          )}

          {/* Collections */}
          {card.collections && card.collections.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Collections</h3>
              <div className="flex flex-wrap gap-2">
                {card.collections.map((collection) => (
                  <Badge
                    key={collection.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => router.push(`/collections/${collection.id}`)}
                  >
                    {collection.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">Created:</span>{" "}
                {new Date(card.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Updated:</span>{" "}
                {new Date(card.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
