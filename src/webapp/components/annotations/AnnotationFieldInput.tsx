import { DyadValueInput } from "./value-types/DyadValueInput";
import { TriadValueInput } from "./value-types/TriadValueInput";
import { RatingValueInput } from "./value-types/RatingValueInput";
import { SingleSelectValueInput } from "./value-types/SingleSelectValueInput";
import { MultiSelectValueInput } from "./value-types/MultiSelectValueInput";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface AnnotationFieldInputProps {
  field: any;
  value: string;
  onChange: (fieldId: string, value: string) => void;
}

export function AnnotationFieldInput({ field, value, onChange }: AnnotationFieldInputProps) {
  const handleChange = (newValue: string) => {
    onChange(field.id, newValue);
  };

  switch (field.definitionType) {
    case 'dyad':
      return <DyadValueInput field={field} value={value} onChange={handleChange} />;
    case 'triad':
      return <TriadValueInput field={field} value={value} onChange={handleChange} />;
    case 'rating':
      return <RatingValueInput field={field} value={value} onChange={handleChange} />;
    case 'singleSelect':
      return <SingleSelectValueInput field={field} value={value} onChange={handleChange} />;
    case 'multiSelect':
      return <MultiSelectValueInput field={field} value={value} onChange={handleChange} />;
    default:
      // Default text input for any other type
      return (
        <div className="space-y-2">
          <Label htmlFor={field.id}>
            {field.name}
            {field.required && <span className="text-red-500">*</span>}
          </Label>
          <p className="text-xs text-gray-500">{field.description}</p>
          <Input
            id={field.id}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Enter value"
          />
        </div>
      );
  }
}
