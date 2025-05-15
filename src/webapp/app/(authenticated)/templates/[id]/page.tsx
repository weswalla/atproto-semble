"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { annotationService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Hash } from "lucide-react";

interface TemplateField {
  id: string;
  name: string;
  description: string;
  required: boolean;
  definitionType: string;
  definition: any;
}

interface TemplateDetail {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  curatorId: string;
  fields: TemplateField[];
}

export default function TemplateDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { accessToken } = useAuth();
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!accessToken) return;
      
      try {
        setIsLoading(true);
        const data = await annotationService.getTemplateById(accessToken, id);
        setTemplate(data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch template:", err);
        setError(err.message || "Failed to load template");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplate();
  }, [accessToken, id]);

  // Helper function to get a human-readable field type
  const getFieldTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      dyad: "Dyad",
      triad: "Triad",
      rating: "Rating",
      "single-select": "Single Select",
      "multi-select": "Multi Select"
    };
    return typeMap[type] || type;
  };

  // Helper function to render field definition details
  const renderFieldDefinition = (field: TemplateField) => {
    switch (field.definitionType) {
      case "dyad":
        return (
          <div className="mt-2 text-sm">
            <p><span className="font-medium">Side A:</span> {field.definition.sideA}</p>
            <p><span className="font-medium">Side B:</span> {field.definition.sideB}</p>
          </div>
        );
      case "triad":
        return (
          <div className="mt-2 text-sm">
            <p><span className="font-medium">Vertex A:</span> {field.definition.vertexA}</p>
            <p><span className="font-medium">Vertex B:</span> {field.definition.vertexB}</p>
            <p><span className="font-medium">Vertex C:</span> {field.definition.vertexC}</p>
          </div>
        );
      case "rating":
        return (
          <div className="mt-2 text-sm">
            <p><span className="font-medium">Rating:</span> {field.definition.numberOfStars} stars</p>
          </div>
        );
      case "single-select":
      case "multi-select":
        return (
          <div className="mt-2 text-sm">
            <p className="font-medium">Options:</p>
            <ul className="list-disc pl-5 mt-1">
              {field.definition.options.map((option: string, index: number) => (
                <li key={index}>{option}</li>
              ))}
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Templates
        </Button>
        
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-5 w-1/2 mb-8" />
          </>
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
        ) : template ? (
          <>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2">{template.name}</h1>
                <p className="text-gray-500 mb-4">{template.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    Created {format(new Date(template.createdAt), "PPP")}
                  </div>
                  <div className="flex items-center">
                    <User className="mr-1 h-4 w-4" />
                    {template.curatorId.split(":").pop()}
                  </div>
                  <div className="flex items-center">
                    <Hash className="mr-1 h-4 w-4" />
                    {template.id.substring(0, 8)}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/annotate?templateId=${template.id}`}>
                  <Button>Create Annotation</Button>
                </Link>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Fields Section */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : template ? (
        <>
          <h2 className="text-xl font-semibold mb-4">Fields ({template.fields.length})</h2>
          <div className="space-y-4">
            {template.fields.map((field) => (
              <Card key={field.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{field.name}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant={field.required ? "default" : "outline"}>
                        {field.required ? "Required" : "Optional"}
                      </Badge>
                      <Badge variant="secondary">
                        {getFieldTypeLabel(field.definitionType)}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{field.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderFieldDefinition(field)}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
