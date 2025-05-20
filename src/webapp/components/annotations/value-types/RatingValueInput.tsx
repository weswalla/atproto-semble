import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface RatingValueInputProps {
  field: any;
  value: string;
  onChange: (value: string) => void;
}

export function RatingValueInput({ field, value, onChange }: RatingValueInputProps) {
  const min = 1;
  const max = field.definition.numberOfStars || 5;
  
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.name}
        {field.required && <span className="text-red-500">*</span>}
      </Label>
      <p className="text-xs text-gray-500">{field.description}</p>
      <div className="flex items-center space-x-2">
        <Input
          id={field.id}
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Rating (${min}-${max})`}
          className="w-24"
        />
        <span className="text-sm text-gray-500">
          out of {max} stars
        </span>
      </div>
    </div>
  );
}
