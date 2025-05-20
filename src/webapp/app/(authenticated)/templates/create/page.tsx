"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TemplateField,
  AnnotationFieldDefinition,
  DyadDefinition,
  TriadDefinition,
  RatingDefinition,
  SingleSelectDefinition,
  MultiSelectDefinition,
} from "@/types/annotations";
import { CreateTemplateResponse } from "@/types/api";
import { TemplateFieldEditor } from "@/components/templates/TemplateFieldEditor";
import { annotationService, ApiError } from "@/services/api";

export default function CreateTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const addField = () => {
    const newField: TemplateField = {
      id: Date.now().toString(),
      name: "",
      description: "",
      definition: {
        type: "dyad",
        sideA: "Agree",
        sideB: "Disagree",
      },
      required: false,
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<TemplateField>) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const updateFieldDefinition = (
    id: string,
    definitionUpdates: Partial<AnnotationFieldDefinition>
  ) => {
    setFields(
      fields.map((field) => {
        if (field.id === id) {
          return {
            ...field,
            definition: {
              ...field.definition,
              ...definitionUpdates,
            } as AnnotationFieldDefinition,
          };
        }
        return field;
      })
    );
  };

  const removeField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
  };

  // Handle field type change
  const handleFieldTypeChange = (id: string, newType: string) => {
    const field = fields.find((f) => f.id === id);
    if (!field) return;

    let newDefinition: AnnotationFieldDefinition;

    switch (newType) {
      case "dyad":
        newDefinition = {
          type: "dyad",
          sideA: "Agree",
          sideB: "Disagree",
        } as DyadDefinition;
        break;
      case "triad":
        newDefinition = {
          type: "triad",
          vertexA: "Option A",
          vertexB: "Option B",
          vertexC: "Option C",
        } as TriadDefinition;
        break;
      case "rating":
        newDefinition = {
          type: "rating",
          numberOfStars: 5,
        } as RatingDefinition;
        break;
      case "singleSelect":
        newDefinition = {
          type: "singleSelect",
          options: ["Option 1", "Option 2"],
        } as SingleSelectDefinition;
        break;
      case "multiSelect":
        newDefinition = {
          type: "multiSelect",
          options: ["Option 1", "Option 2"],
        } as MultiSelectDefinition;
        break;
      default:
        return;
    }

    updateField(id, { definition: newDefinition });
  };

  const validateTemplate = (): string | null => {
    // Validate form
    if (!name.trim()) {
      return "Template name is required";
    }

    if (fields.length === 0) {
      return "At least one field is required";
    }

    // Validate each field
    for (const field of fields) {
      if (!field.name.trim()) {
        return "All fields must have a name";
      }

      // Validate field-specific requirements
      switch (field.definition.type) {
        case "dyad":
          if (!field.definition.sideA || !field.definition.sideB) {
            return `Field "${field.name}" is missing dyad labels`;
          }
          break;
        case "triad":
          if (
            !field.definition.vertexA ||
            !field.definition.vertexB ||
            !field.definition.vertexC
          ) {
            return `Field "${field.name}" is missing triad labels`;
          }
          break;
        case "rating":
          if (
            !field.definition.numberOfStars ||
            field.definition.numberOfStars < 1
          ) {
            return `Field "${field.name}" needs a valid number of stars`;
          }
          break;
        case "singleSelect":
        case "multiSelect":
          if (
            !field.definition.options ||
            field.definition.options.length < 2
          ) {
            return `Field "${field.name}" needs at least 2 options`;
          }
          break;
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const validationError = validateTemplate();
      if (validationError) {
        throw new Error(validationError);
      }

      // Format the data for API submission
      const templateData = {
        name,
        description,
        fields: fields.map((field) => ({
          name: field.name,
          description: field.description,
          type: field.definition.type,
          definition: field.definition,
          required: field.required,
        })),
      };

      // Get access token from local storage
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("You must be logged in to create a template");
      }

      // Submit to API
      try {
        const response: CreateTemplateResponse =
          await annotationService.createTemplate(accessToken, templateData);

        console.log("Template created with ID:", response.templateId);

        // Redirect to templates page
        router.push("/templates");
      } catch (apiError: any) {
        if (apiError instanceof ApiError) {
          throw new Error(`API Error: ${apiError.message}`);
        }
        throw apiError;
      }
    } catch (err: any) {
      setError(err.message || "Failed to create template");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Annotation Template</h1>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Article Quality Assessment"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe the purpose of this template"
            />
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Template Fields</h3>
              <Button type="button" onClick={addField} variant="outline">
                Add Field
              </Button>
            </div>

            {fields.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-gray-300 rounded-md">
                <p className="text-gray-500 mb-4">No fields added yet</p>
                <Button type="button" onClick={addField}>
                  Add your first field
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field) => (
                  <TemplateFieldEditor
                    key={field.id}
                    field={field}
                    onUpdate={(updates) => updateField(field.id, updates)}
                    onUpdateDefinition={(updates) =>
                      updateFieldDefinition(field.id, updates)
                    }
                    onRemove={() => removeField(field.id)}
                    onTypeChange={(newType) =>
                      handleFieldTypeChange(field.id, newType)
                    }
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/templates")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Template"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
