"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

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

  return (
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
          {imageUrl && (
            <div className="ml-4 flex-shrink-0">
              <img
                src={imageUrl}
                alt={title || "Card image"}
                className="w-16 h-16 object-cover rounded-md"
              />
            </div>
          )}
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
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Visit link →
        </a>
      </CardContent>
    </Card>
  );
}
