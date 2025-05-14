"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/api";
import { isAuthenticated, getAccessToken, clearAuth } from "@/services/auth";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Check if user is authenticated
        if (!isAuthenticated()) {
          router.push("/");
          return;
        }
        
        const accessToken = getAccessToken();
        
        // Fetch user data
        const userData = await authService.getCurrentUser(accessToken!);
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user:", error);
        // If there's an error (like expired token), redirect to home
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [router]);
  
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
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col">
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-6">Welcome!</h2>
          
          {user && (
            <div className="mb-6">
              <p className="mb-2"><strong>Handle:</strong> {user.handle}</p>
              <p><strong>DID:</strong> {user.did}</p>
            </div>
          )}
          
          <div className="flex justify-center">
            <Button onClick={handleLogout} variant="outline" className="w-full">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
