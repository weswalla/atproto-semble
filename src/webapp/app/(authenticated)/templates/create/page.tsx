"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface TemplateField {
  id: string;
  name: string;
  description: string;
  type: string;
  options?: string[];
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
      type: "dyad",
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

      // TODO: Submit to API
      console.log("Submitting template:", { name, description, fields });
      
      // Redirect to templates page
      router.push("/templates");
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
                          value={field.type}
                          onChange={(e) =>
                            updateField(field.id, { type: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="dyad">Dyad</option>
                          <option value="triad">Triad</option>
                          <option value="rating">Rating</option>
                          <option value="select">Select</option>
                        </select>
                      </div>
                    </div>

                    <div>
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

                    {field.type === "select" && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Options (comma separated)
                        </label>
                        <input
                          type="text"
                          value={field.options?.join(", ") || ""}
                          onChange={(e) =>
                            updateField(field.id, {
                              options: e.target.value
                                .split(",")
                                .map((opt) => opt.trim())
                                .filter(Boolean),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Option 1, Option 2, Option 3"
                        />
                      </div>
                    )}
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
