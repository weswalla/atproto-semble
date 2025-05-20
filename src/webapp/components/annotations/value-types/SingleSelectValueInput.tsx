import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SingleSelectValueInputProps {
  field: any;
  value: string;
  onChange: (value: string) => void;
}

export function SingleSelectValueInput({ field, value, onChange }: SingleSelectValueInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.name}
        {field.required && <span className="text-red-500">*</span>}
      </Label>
      <p className="text-xs text-gray-500">{field.description}</p>
      <Select
        value={value}
        onValueChange={onChange}
      >
        <SelectTrigger id={field.id}>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {field.definition.options.map((option: string) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
