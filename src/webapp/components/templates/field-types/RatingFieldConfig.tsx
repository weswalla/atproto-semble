import { RatingDefinition } from "@/types/annotations";

interface RatingFieldConfigProps {
  definition: RatingDefinition;
  onUpdate: (updates: Partial<RatingDefinition>) => void;
}

export function RatingFieldConfig({ definition, onUpdate }: RatingFieldConfigProps) {
  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Number of Stars
      </label>
      <input
        type="number"
        min="1"
        max="10"
        value={definition.numberOfStars || 5}
        onChange={(e) =>
          onUpdate({ numberOfStars: parseInt(e.target.value) || 5 })
        }
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
    </div>
  );
}
