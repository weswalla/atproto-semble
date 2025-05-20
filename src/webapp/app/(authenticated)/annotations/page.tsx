"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { annotationService } from "@/services/api";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Annotation {
  id: string;
  url: string;
  fieldName: string;
  valueType: string;
  valuePreview: string;
  createdAt: string;
  templateName?: string;
}

export default function AnnotationsPage() {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  useEffect(() => {
    const fetchAnnotations = async () => {
      if (!accessToken) return;
      
      try {
        setIsLoading(true);
        const data = await annotationService.getMyAnnotations(accessToken);
        setAnnotations(data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch annotations:", err);
        setError(err.message || "Failed to load annotations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnotations();
  }, [accessToken]);

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Annotations</h1>
        <Link href="/annotations/create">
          <Button>New Annotation</Button>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-800 mb-6">
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      ) : annotations.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No annotations yet</p>
            <Link href="/annotations/create">
              <Button>Create your first annotation</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {annotations.map((annotation) => (
            <Card key={annotation.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="truncate">{annotation.fieldName}</CardTitle>
                  <Badge variant="outline">{annotation.valueType}</Badge>
                </div>
                <CardDescription className="truncate">
                  <a href={annotation.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {annotation.url}
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-2">
                  {annotation.valuePreview}
                </p>
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>Created {format(new Date(annotation.createdAt), "PPP")}</span>
                  {annotation.templateName && (
                    <span>{annotation.templateName}</span>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/annotations/${annotation.id}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    View Annotation
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
