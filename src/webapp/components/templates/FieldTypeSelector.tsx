import { AnnotationFieldDefinition } from "@/types/annotations";

interface FieldTypeSelectorProps {
  value: string;
  onChange: (newType: string) => void;
}

export function FieldTypeSelector({ value, onChange }: FieldTypeSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Type
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      >
        <option value="dyad">Dyad</option>
        <option value="triad">Triad</option>
        <option value="rating">Rating</option>
        <option value="singleSelect">Single Select</option>
        <option value="multiSelect">Multi Select</option>
      </select>
    </div>
  );
}
