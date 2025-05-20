import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TriadValueInputProps {
  field: any;
  value: string;
  onChange: (value: string) => void;
}

export function TriadValueInput({
  field,
  value,
  onChange,
}: TriadValueInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.name}
        {field.required && <span className="text-red-500">*</span>}
      </Label>
      <p className="text-xs text-gray-500">{field.description}</p>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm font-medium mb-1">{field.definition.vertexA}</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium mb-1">{field.definition.vertexB}</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium mb-1">{field.definition.vertexC}</p>
        </div>
      </div>
      <Input
        id={field.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter value"
      />
    </div>
  );
}
