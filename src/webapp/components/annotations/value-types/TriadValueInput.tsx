import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

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
  // Parse the value string to get individual vertex values
  const [vertexValues, setVertexValues] = useState({
    vertexA: "",
    vertexB: "",
    vertexC: "",
  });

  // Parse the value when it changes externally
  useEffect(() => {
    if (value) {
      try {
        const parsedValues = JSON.parse(value);
        setVertexValues({
          vertexA: parsedValues.vertexA || "",
          vertexB: parsedValues.vertexB || "",
          vertexC: parsedValues.vertexC || "",
        });
      } catch (e) {
        // If parsing fails, reset to empty values
        setVertexValues({ vertexA: "", vertexB: "", vertexC: "" });
      }
    } else {
      setVertexValues({ vertexA: "", vertexB: "", vertexC: "" });
    }
  }, [value]);

  // Update the combined value when individual values change
  const handleVertexChange = (vertex: string, newValue: string) => {
    const updatedValues = {
      ...vertexValues,
      [vertex]: newValue,
    };
    setVertexValues(updatedValues);
    onChange(JSON.stringify(updatedValues));
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.name}
        {field.required && <span className="text-red-500">*</span>}
      </Label>
      <p className="text-xs text-gray-500">{field.description}</p>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm font-medium mb-1">{field.definition.vertexA}</p>
          <Input
            id={`${field.id}-vertexA`}
            type="number"
            value={vertexValues.vertexA}
            onChange={(e) => handleVertexChange("vertexA", e.target.value)}
            placeholder="Enter value"
            min="0"
            max="1000"
          />
        </div>
        <div>
          <p className="text-sm font-medium mb-1">{field.definition.vertexB}</p>
          <Input
            id={`${field.id}-vertexB`}
            type="number"
            value={vertexValues.vertexB}
            onChange={(e) => handleVertexChange("vertexB", e.target.value)}
            placeholder="Enter value"
            min="0"
            max="1000"
          />
        </div>
        <div>
          <p className="text-sm font-medium mb-1">{field.definition.vertexC}</p>
          <Input
            id={`${field.id}-vertexC`}
            type="number"
            value={vertexValues.vertexC}
            onChange={(e) => handleVertexChange("vertexC", e.target.value)}
            placeholder="Enter value"
            min="0"
            max="1000"
          />
        </div>
      </div>
    </div>
  );
}
