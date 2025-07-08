"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink } from "lucide-react";
import { AddToCollectionModal } from "./AddToCollectionModal";

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
  const [showAddToCollectionModal, setShowAddToCollectionModal] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
      <Card className="w-full hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight mb-1 truncate">
                {title || getDomain(url)}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {getDomain(url)} • {formatDate(addedAt)}
              </p>
            </div>
            <div className="ml-4 flex items-center gap-2">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={title || "Card image"}
                  className="w-16 h-16 object-cover rounded-md"
                />
              )}
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddToCollectionModal(true)}
                  title="Add to collection"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(url, '_blank')}
                  title="Open link"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {description && (
            <p className="text-gray-700 text-sm mb-3 line-clamp-2">
              {description}
            </p>
          )}
          {author && (
            <p className="text-xs text-gray-500 mb-2">
              By {author}
            </p>
          )}
          {note && (
            <div className="bg-yellow-50 border-l-4 border-yellow-200 p-2 mb-3">
              <p className="text-sm text-gray-700">{note}</p>
            </div>
          )}
        </CardContent>
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
