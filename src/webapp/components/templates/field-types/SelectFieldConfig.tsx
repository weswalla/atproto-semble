import { SingleSelectDefinition, MultiSelectDefinition } from "@/types/annotations";

interface SelectFieldConfigProps {
  definition: SingleSelectDefinition | MultiSelectDefinition;
  onUpdate: (updates: Partial<SingleSelectDefinition | MultiSelectDefinition>) => void;
}

export function SelectFieldConfig({ definition, onUpdate }: SelectFieldConfigProps) {
  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Options (one per line)
      </label>
      <textarea
        value={definition.options?.join("\n") || ""}
        onChange={(e) =>
          onUpdate({
            options: e.target.value
              .split("\n")
              .map((opt) => opt.trim())
              .filter(Boolean),
          })
        }
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        rows={4}
        placeholder="Option 1&#10;Option 2&#10;Option 3"
      />
      <p className="text-sm text-gray-500 mt-1">
        Enter each option on a new line
      </p>
    </div>
  );
}
