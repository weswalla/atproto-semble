"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/library");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col">
        <h1 className="text-4xl font-bold mb-8">Welcome to Annos</h1>
        <p className="text-xl mb-8">Your annotation platform</p>

        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-6 text-center">Sign In</h2>
          <p className="mb-6 text-center text-gray-600">
            Please sign in to access your annotations
          </p>
          <div className="flex justify-center">
            <Link href="/login" className="w-full">
              <Button className="w-full">Sign in with Bluesky</Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
