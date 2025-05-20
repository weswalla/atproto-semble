import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { MultiSelectValue } from "@/types/annotationValues";

interface MultiSelectValueInputProps {
  field: any;
  value: string;
  onChange: (value: string) => void;
}

export function MultiSelectValueInput({ field, value, onChange }: MultiSelectValueInputProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Parse the value string to array when it changes
  useEffect(() => {
    if (value) {
      try {
        setSelectedOptions(JSON.parse(value));
      } catch (e) {
        setSelectedOptions([]);
      }
    } else {
      setSelectedOptions([]);
    }
  }, [value]);

  const handleOptionToggle = (option: string) => {
    const updatedOptions = selectedOptions.includes(option)
      ? selectedOptions.filter(item => item !== option)
      : [...selectedOptions, option];
    
    setSelectedOptions(updatedOptions);
    onChange(JSON.stringify(updatedOptions));
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.name}
        {field.required && <span className="text-red-500">*</span>}
      </Label>
      <p className="text-xs text-gray-500">{field.description}</p>
      <div className="space-y-2">
        {field.definition.options.map((option: string) => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={`${field.id}-${option}`}
              checked={selectedOptions.includes(option)}
              onCheckedChange={() => handleOptionToggle(option)}
            />
            <label
              htmlFor={`${field.id}-${option}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {option}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
