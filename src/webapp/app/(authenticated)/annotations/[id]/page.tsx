"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { annotationService } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowLeft, ExternalLink } from "lucide-react";

interface AnnotationDetail {
  id: string;
  url: string;
  fieldName: string;
  fieldDescription: string;
  valueType: string;
  valueData: any;
  valuePreview: string;
  note?: string;
  createdAt: string;
  curatorId: string;
  templateName?: string;
  publishedRecordId?: {
    uri: string;
    cid: string;
  };
}

export default function AnnotationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { accessToken } = useAuth();
  const [annotation, setAnnotation] = useState<AnnotationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnotation = async () => {
      if (!accessToken || !id) return;

      try {
        setIsLoading(true);
        const data = await annotationService.getAnnotationById(
          accessToken,
          id as string
        );
        setAnnotation(data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch annotation:", err);
        setError(err.message || "Failed to load annotation");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnotation();
  }, [accessToken, id]);

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="bg-red-50 p-4 rounded-md text-red-800">
              <p>{error}</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!annotation) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardContent className="pt-6 text-center">
            <p>Annotation not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Annotations
        </Button>

        <div className="flex items-center space-x-2">
          <Badge variant="outline">{annotation.valueType}</Badge>
          {annotation.templateName && (
            <Badge variant="secondary">{annotation.templateName}</Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{annotation.fieldName}</CardTitle>
          <CardDescription>{annotation.fieldDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">URL</h3>
            <a
              href={annotation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center"
            >
              {annotation.url}
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Value</h3>
            <p>{annotation.valuePreview}</p>
          </div>

          {annotation.note && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Note</h3>
              <p>{annotation.note}</p>
            </div>
          )}

          {annotation.publishedRecordId && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Published Record
              </h3>
              <p className="text-sm break-all">
                <span className="font-medium">URI:</span>{" "}
                {annotation.publishedRecordId.uri}
              </p>
              <p className="text-sm break-all">
                <span className="font-medium">CID:</span>{" "}
                {annotation.publishedRecordId.cid}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-between text-sm text-gray-500">
          <span>Created {format(new Date(annotation.createdAt), "PPP")}</span>
          <span>ID: {annotation.id}</span>
        </CardFooter>
      </Card>
    </div>
  );
}
