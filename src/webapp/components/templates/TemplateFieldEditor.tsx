import { TemplateField } from "@/types/annotations";
import { FieldTypeSelector } from "./FieldTypeSelector";
import { DyadFieldConfig } from "./field-types/DyadFieldConfig";
import { TriadFieldConfig } from "./field-types/TriadFieldConfig";
import { RatingFieldConfig } from "./field-types/RatingFieldConfig";
import { SelectFieldConfig } from "./field-types/SelectFieldConfig";

interface TemplateFieldEditorProps {
  field: TemplateField;
  onUpdate: (updates: Partial<TemplateField>) => void;
  onUpdateDefinition: (updates: any) => void;
  onRemove: () => void;
  onTypeChange: (newType: string) => void;
}

export function TemplateFieldEditor({
  field,
  onUpdate,
  onUpdateDefinition,
  onRemove,
  onTypeChange,
}: TemplateFieldEditorProps) {
  // Helper to render field-specific configuration UI
  const renderFieldTypeConfig = () => {
    switch (field.definition.type) {
      case "dyad":
        return (
          <DyadFieldConfig
            definition={field.definition}
            onUpdate={onUpdateDefinition}
          />
        );
      
      case "triad":
        return (
          <TriadFieldConfig
            definition={field.definition}
            onUpdate={onUpdateDefinition}
          />
        );
      
      case "rating":
        return (
          <RatingFieldConfig
            definition={field.definition}
            onUpdate={onUpdateDefinition}
          />
        );
      
      case "singleSelect":
      case "multiSelect":
        return (
          <SelectFieldConfig
            definition={field.definition}
            onUpdate={onUpdateDefinition}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="p-4 border border-gray-200 rounded-md">
      <div className="flex justify-between mb-4">
        <h4 className="font-medium">Field</h4>
        <button
          type="button"
          onClick={onRemove}
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
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="e.g., Quality Rating"
          />
        </div>
        <FieldTypeSelector 
          value={field.definition.type} 
          onChange={onTypeChange} 
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          type="text"
          value={field.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Describe this field"
        />
      </div>

      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700">Required field</span>
        </label>
      </div>

      {renderFieldTypeConfig()}
    </div>
  );
}
