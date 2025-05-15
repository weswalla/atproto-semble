import { TriadDefinition } from "@/types/annotations";

interface TriadFieldConfigProps {
  definition: TriadDefinition;
  onUpdate: (updates: Partial<TriadDefinition>) => void;
}

export function TriadFieldConfig({ definition, onUpdate }: TriadFieldConfigProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mt-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Side A Label
        </label>
        <input
          type="text"
          value={definition.sideA}
          onChange={(e) => onUpdate({ sideA: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="e.g., Option A"
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
          placeholder="e.g., Option B"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Side C Label
        </label>
        <input
          type="text"
          value={definition.sideC}
          onChange={(e) => onUpdate({ sideC: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="e.g., Option C"
        />
      </div>
    </div>
  );
}
