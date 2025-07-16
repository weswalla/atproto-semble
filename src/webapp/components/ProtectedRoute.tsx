"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/services/auth";
import { Loader } from "@mantine/core";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check if the user is authenticated
    if (!isAuthenticated()) {
      router.push("/");
      return;
    }

    setIsAuthorized(true);
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return <Loader />;
  }

  return isAuthorized ? <>{children}</> : null;
}
