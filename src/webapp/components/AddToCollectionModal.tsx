"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { getAccessToken } from "@/services/auth";
import { ApiClient } from "@/api-client/ApiClient";
import type { GetMyCollectionsResponse } from "@/api-client/types";

interface AddToCollectionModalProps {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddToCollectionModal({ cardId, isOpen, onClose, onSuccess }: AddToCollectionModalProps) {
  const [collections, setCollections] = useState<GetMyCollectionsResponse["collections"]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Create API client instance
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000",
    () => getAccessToken()
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
      // Add card to each selected collection
      const promises = Array.from(selectedCollections).map(collectionId =>
        apiClient.addCardToCollection({ cardId, collectionId })
      );

      await Promise.all(promises);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Add to Collections</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={submitting}
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error && collections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchCollections} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No collections found</p>
              <Button onClick={() => window.open('/collections/create', '_blank')} variant="outline" size="sm">
                Create Collection
              </Button>
            </div>
          ) : (
            <>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {collections.map((collection) => (
                  <div key={collection.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      id={collection.id}
                      checked={selectedCollections.has(collection.id)}
                      onCheckedChange={() => handleCollectionToggle(collection.id)}
                      disabled={submitting}
                    />
                    <label
                      htmlFor={collection.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{collection.name}</div>
                      {collection.description && (
                        <div className="text-sm text-gray-500 truncate">
                          {collection.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        {collection.cardCount} cards
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || selectedCollections.size === 0}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    `Add to ${selectedCollections.size} Collection${selectedCollections.size !== 1 ? 's' : ''}`
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
