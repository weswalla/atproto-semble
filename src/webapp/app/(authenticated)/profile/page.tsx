"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/services/auth";
import { ApiClient } from "@/api-client/ApiClient";
import type { GetMyProfileResponse } from "@/api-client/types";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const [profile, setProfile] = useState<GetMyProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const { logout } = useAuth();

  // Create API client instance
  const apiClient = new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000",
    () => getAccessToken()
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getMyProfile();
        setProfile(response);
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        setError(error.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "Failed to load profile"}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h1 className="text-3xl font-bold">Profile</h1>
        <Button variant="destructive" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            {profile.avatarUrl && (
              <img
                src={profile.avatarUrl}
                alt={`${profile.name}'s avatar`}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <CardTitle className="text-2xl">{profile.name}</CardTitle>
              <CardDescription className="text-lg">
                @{profile.handle}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        {profile.description && (
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              {profile.description}
            </p>
          </CardContent>
        )}
      </Card>

      {/* Profile Details */}
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">User ID</label>
            <p className="text-sm font-mono bg-gray-100 p-2 rounded">
              {profile.id}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Handle</label>
            <p className="text-sm">@{profile.handle}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Display Name
            </label>
            <p className="text-sm">{profile.name}</p>
          </div>
          {profile.description && (
            <div>
              <label className="text-sm font-medium text-gray-500">
                Description
              </label>
              <p className="text-sm">{profile.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
