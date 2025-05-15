import { DyadDefinition } from "@/types/annotations";

interface DyadFieldConfigProps {
  definition: DyadDefinition;
  onUpdate: (updates: Partial<DyadDefinition>) => void;
}

export function DyadFieldConfig({ definition, onUpdate }: DyadFieldConfigProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Side A Label
        </label>
        <input
          type="text"
          value={definition.sideA}
          onChange={(e) => onUpdate({ sideA: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="e.g., Agree"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Side B Label
        </label>
        <input
          type="text"
          value={definition.sideB}
          onChange={(e) => onUpdate({ sideB: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="e.g., Disagree"
        />
      </div>
    </div>
  );
}
