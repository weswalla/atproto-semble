import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DyadValue } from "@/types/annotationValues";

interface DyadValueInputProps {
  field: any;
  value: string;
  onChange: (value: string) => void;
}

export function DyadValueInput({ field, value, onChange }: DyadValueInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.name}
        {field.required && <span className="text-red-500">*</span>}
      </Label>
      <p className="text-xs text-gray-500">{field.description}</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-sm font-medium mb-1">{field.definition.sideA}</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium mb-1">{field.definition.sideB}</p>
        </div>
      </div>
      <Input
        id={field.id}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter numeric value"
        min="0"
        max="100"
      />
    </div>
  );
}
