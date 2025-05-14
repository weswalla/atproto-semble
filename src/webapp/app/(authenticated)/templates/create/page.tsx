"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface FieldDefinition {
  // Common properties for all field types
  type: string;
  required?: boolean;
}

interface DyadDefinition extends FieldDefinition {
  type: "dyad";
  sideA: string;
  sideB: string;
}

interface TriadDefinition extends FieldDefinition {
  type: "triad";
  sideA: string;
  sideB: string;
  sideC: string;
}

interface RatingDefinition extends FieldDefinition {
  type: "rating";
  numberOfStars: number;
}

interface SingleSelectDefinition extends FieldDefinition {
  type: "singleSelect";
  options: string[];
}

interface MultiSelectDefinition extends FieldDefinition {
  type: "multiSelect";
  options: string[];
}

type AnnotationFieldDefinition =
  | DyadDefinition
  | TriadDefinition
  | RatingDefinition
  | SingleSelectDefinition
  | MultiSelectDefinition;

interface TemplateField {
  id: string;
  name: string;
  description: string;
  definition: AnnotationFieldDefinition;
  required: boolean;
}

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
            },
          };
        }
        return field;
      })
    );
  };

  const removeField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Validate form
      if (!name.trim()) {
        throw new Error("Template name is required");
      }

      if (fields.length === 0) {
        throw new Error("At least one field is required");
      }

      // Validate each field
      for (const field of fields) {
        if (!field.name.trim()) {
          throw new Error("All fields must have a name");
        }

        // Validate field-specific requirements
        switch (field.definition.type) {
          case "dyad":
            if (!field.definition.sideA || !field.definition.sideB) {
              throw new Error(`Field "${field.name}" is missing dyad labels`);
            }
            break;
          case "triad":
            if (!field.definition.sideA || !field.definition.sideB || !field.definition.sideC) {
              throw new Error(`Field "${field.name}" is missing triad labels`);
            }
            break;
          case "rating":
            if (!field.definition.numberOfStars || field.definition.numberOfStars < 1) {
              throw new Error(`Field "${field.name}" needs a valid number of stars`);
            }
            break;
          case "singleSelect":
          case "multiSelect":
            if (!field.definition.options || field.definition.options.length < 2) {
              throw new Error(`Field "${field.name}" needs at least 2 options`);
            }
            break;
        }
      }

      // Format the data for API submission
      const templateData = {
        name,
        description,
        fields: fields.map(field => ({
          name: field.name,
          description: field.description,
          type: field.definition.type,
          definition: field.definition,
          required: field.required
        }))
      };

      // TODO: Submit to API
      console.log("Submitting template:", templateData);
      
      // Redirect to templates page
      router.push("/templates");
    } catch (err: any) {
      setError(err.message || "Failed to create template");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to render field-specific configuration UI
  const renderFieldTypeConfig = (field: TemplateField) => {
    switch (field.definition.type) {
      case "dyad":
        return (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Side A Label
              </label>
              <input
                type="text"
                value={(field.definition as DyadDefinition).sideA}
                onChange={(e) =>
                  updateFieldDefinition(field.id, { sideA: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Agree"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Side B Label
              </label>
              <input
                type="text"
                value={(field.definition as DyadDefinition).sideB}
                onChange={(e) =>
                  updateFieldDefinition(field.id, { sideB: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Disagree"
              />
            </div>
          </div>
        );
      
      case "triad":
        return (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Side A Label
              </label>
              <input
                type="text"
                value={(field.definition as TriadDefinition).sideA}
                onChange={(e) =>
                  updateFieldDefinition(field.id, { sideA: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Option A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Side B Label
              </label>
              <input
                type="text"
                value={(field.definition as TriadDefinition).sideB}
                onChange={(e) =>
                  updateFieldDefinition(field.id, { sideB: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Option B"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Side C Label
              </label>
              <input
                type="text"
                value={(field.definition as TriadDefinition).sideC}
                onChange={(e) =>
                  updateFieldDefinition(field.id, { sideC: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Option C"
              />
            </div>
          </div>
        );
      
      case "rating":
        return (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Stars
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={(field.definition as RatingDefinition).numberOfStars || 5}
              onChange={(e) =>
                updateFieldDefinition(field.id, { 
                  numberOfStars: parseInt(e.target.value) || 5 
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        );
      
      case "singleSelect":
      case "multiSelect":
        return (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Options (one per line)
            </label>
            <textarea
              value={(field.definition as SingleSelectDefinition | MultiSelectDefinition).options?.join("\n") || ""}
              onChange={(e) =>
                updateFieldDefinition(field.id, {
                  options: e.target.value
                    .split("\n")
                    .map((opt) => opt.trim())
                    .filter(Boolean),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={4}
              placeholder="Option 1&#10;Option 2&#10;Option 3"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter each option on a new line
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Handle field type change
  const handleFieldTypeChange = (id: string, newType: string) => {
    const field = fields.find(f => f.id === id);
    if (!field) return;

    let newDefinition: AnnotationFieldDefinition;

    switch (newType) {
      case "dyad":
        newDefinition = {
          type: "dyad",
          sideA: "Agree",
          sideB: "Disagree"
        };
        break;
      case "triad":
        newDefinition = {
          type: "triad",
          sideA: "Option A",
          sideB: "Option B",
          sideC: "Option C"
        };
        break;
      case "rating":
        newDefinition = {
          type: "rating",
          numberOfStars: 5
        };
        break;
      case "singleSelect":
        newDefinition = {
          type: "singleSelect",
          options: ["Option 1", "Option 2"]
        };
        break;
      case "multiSelect":
        newDefinition = {
          type: "multiSelect",
          options: ["Option 1", "Option 2"]
        };
        break;
      default:
        return;
    }

    updateField(id, { definition: newDefinition });
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
                  <div
                    key={field.id}
                    className="p-4 border border-gray-200 rounded-md"
                  >
                    <div className="flex justify-between mb-4">
                      <h4 className="font-medium">Field</h4>
                      <button
                        type="button"
                        onClick={() => removeField(field.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) =>
                            updateField(field.id, { name: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="e.g., Quality Rating"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={field.definition.type}
                          onChange={(e) =>
                            handleFieldTypeChange(field.id, e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="dyad">Dyad</option>
                          <option value="triad">Triad</option>
                          <option value="rating">Rating</option>
                          <option value="singleSelect">Single Select</option>
                          <option value="multiSelect">Multi Select</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={field.description}
                        onChange={(e) =>
                          updateField(field.id, { description: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Describe this field"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) =>
                            updateField(field.id, { required: e.target.checked })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Required field</span>
                      </label>
                    </div>

                    {renderFieldTypeConfig(field)}
                  </div>
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
