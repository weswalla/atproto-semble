import { useState, useEffect } from "react";
import { useExtensionAuth } from "../../hooks/useExtensionAuth";
import { ApiClient } from "../../api-client/ApiClient";

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
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    () => accessToken
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
              "Cannot access this page's URL. Make sure the extension has proper permissions."
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
      <div className="w-80 p-4 bg-white">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-green-600 text-2xl mb-2">✓</div>
            <div className="text-sm text-gray-600">
              Card saved successfully!
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 p-4 bg-white">
      <div className="border-b pb-3 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Save Card</h1>
          <button
            onClick={logout}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* URL Metadata Display */}
        {isLoadingMetadata ? (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">
              Loading page information...
            </div>
          </div>
        ) : metadata ? (
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            {metadata.imageUrl && (
              <img
                src={metadata.imageUrl}
                alt={metadata.title || "Page preview"}
                className="w-full h-24 object-cover rounded"
              />
            )}
            <div>
              <h3 className="font-medium text-sm text-gray-900 line-clamp-2">
                {metadata.title || "Untitled"}
              </h3>
              {metadata.description && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {metadata.description}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1 truncate">
                {metadata.siteName || new URL(currentUrl).hostname}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Current page:</p>
            <p className="text-sm text-gray-800 truncate" title={currentUrl}>
              {currentUrl || "Loading..."}
            </p>
          </div>
        )}

        {/* Note Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note (optional)
          </label>
          <textarea
            placeholder="Add a note about this page..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            disabled={isSaving}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleSaveCard}
            disabled={!currentUrl || isSaving}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? "Saving..." : "Save Card"}
          </button>

          <button
            onClick={() => window.close()}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
