"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/api";
import { getAccessToken, clearAuth } from "@/services/auth";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const accessToken = getAccessToken();
        
        // Fetch user data
        const userData = await authService.getCurrentUser(accessToken!);
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
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
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-6">Welcome!</h2>
        
        {user && (
          <div className="mb-6">
            <p className="mb-2"><strong>Handle:</strong> {user.handle}</p>
            <p><strong>DID:</strong> {user.did}</p>
          </div>
        )}
        
        <div className="flex justify-end">
          <Button onClick={handleLogout} variant="outline">
            Sign Out
          </Button>
        </div>
      </div>
    </>
  );
}
