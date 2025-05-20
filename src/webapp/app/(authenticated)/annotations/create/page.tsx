"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { annotationService } from "@/services/api";
import { formatAnnotationValue } from "@/components/annotations/utils/valueFormatters";
import { Template, TemplateDetail } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { AnnotationFieldInput } from "@/components/annotations/AnnotationFieldInput";

export default function CreateAnnotationPage() {
  const { accessToken } = useAuth();
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDetail | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Fetch templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        if (!accessToken) return;

        const templatesData = await annotationService.getTemplates(accessToken);
        setTemplates(templatesData);
        setLoadingTemplates(false);
      } catch (error) {
        console.error("Error fetching templates:", error);
        setError("Failed to load templates. Please try again.");
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [accessToken]);

  // Fetch template details when a template is selected
  useEffect(() => {
    const fetchTemplateDetails = async () => {
      if (!selectedTemplateId || !accessToken) return;

      try {
        setLoading(true);
        const templateData = await annotationService.getTemplateById(
          accessToken,
          selectedTemplateId
        );

        setSelectedTemplate(templateData);

        // Initialize form values for each field
        const initialValues = {};
        templateData.fields.forEach((field) => {
          initialValues[field.id] = "";
        });

        setFormValues(initialValues);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching template details:", error);
        setError("Failed to load template details. Please try again.");
        setLoading(false);
      }
    };

    fetchTemplateDetails();
  }, [selectedTemplateId, accessToken]);

  const handleInputChange = (fieldId, value) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!url) {
      setError("URL is required");
      return;
    }

    if (!selectedTemplateId) {
      setError("Please select a template");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Prepare annotations data
      const annotations = [];

      for (const field of selectedTemplate.fields) {
        const value = formValues[field.id];

        if (field.required && !value) {
          setError(`${field.name} is required`);
          setLoading(false);
          return;
        }

        // Format the value based on field type
        const formattedValue = formatAnnotationValue(
          field.definitionType,
          value
        );

        annotations.push({
          annotationFieldId: field.id,
          type: field.definitionType,
          value: formattedValue,
        });
      }

      // Submit annotations
      const result = await annotationService.createAnnotationsFromTemplate(
        accessToken,
        {
          url,
          templateId: selectedTemplateId,
          annotations,
        }
      );

      setSuccess(true);
      setLoading(false);

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/annotations");
      }, 2000);
    } catch (error) {
      console.error("Error creating annotations:", error);
      setError(
        error.message || "Failed to create annotations. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Create Annotation</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          Your annotation has been created successfully. Redirecting...
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create a New Annotation</CardTitle>
          <CardDescription>
            Fill out the form below to create an annotation for a URL
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="url">URL to Annotate</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>

              {/* Template Selection */}
              <div className="space-y-2">
                <Label htmlFor="template">Annotation Template</Label>
                {loadingTemplates ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading templates...</span>
                  </div>
                ) : (
                  <Select
                    value={selectedTemplateId}
                    onValueChange={setSelectedTemplateId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Template Fields */}
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                selectedTemplate && (
                  <div className="space-y-6 border rounded-md p-4 bg-gray-50">
                    <h3 className="text-lg font-medium">
                      {selectedTemplate.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedTemplate.description}
                    </p>

                    <div className="space-y-4">
                      {selectedTemplate.fields.map((field) => (
                        <div
                          key={field.id}
                          className="p-3 bg-white rounded-md shadow-sm"
                        >
                          <AnnotationFieldInput
                            field={field}
                            value={formValues[field.id] || ""}
                            onChange={handleInputChange}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="mt-6">
              <Button
                type="submit"
                disabled={loading || !selectedTemplateId || !url}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Annotation"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
