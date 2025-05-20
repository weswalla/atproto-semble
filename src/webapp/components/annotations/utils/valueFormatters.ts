/**
 * Utility functions to format annotation values for API submission
 */
import { 
  AnnotationValueType, 
  DyadValue, 
  TriadValue, 
  RatingValue, 
  SingleSelectValue, 
  MultiSelectValue 
} from "@/types/annotationValues";

/**
 * Formats annotation values based on their type
 */
export const formatAnnotationValue = (type: string, value: string): Partial<AnnotationValueType> => {
  switch (type) {
    case 'rating':
      return { 
        type: 'rating',
        rating: value === "" ? 0 : parseInt(value, 10) 
      } as RatingValue;
    
    case 'dyad':
      return { 
        type: 'dyad',
        value: value === "" ? 0 : parseFloat(value) 
      } as DyadValue;
    
    case 'triad':
      try {
        const parsedValue = JSON.parse(value);
        return {
          type: 'triad',
          vertexA: parsedValue.vertexA === "" ? 0 : parseFloat(parsedValue.vertexA),
          vertexB: parsedValue.vertexB === "" ? 0 : parseFloat(parsedValue.vertexB),
          vertexC: parsedValue.vertexC === "" ? 0 : parseFloat(parsedValue.vertexC)
        } as TriadValue;
      } catch (e) {
        console.error("Error parsing triad value:", e);
        return { 
          type: 'triad',
          vertexA: 0, 
          vertexB: 0, 
          vertexC: 0 
        } as TriadValue;
      }
    
    case 'multiSelect':
      try {
        return { 
          type: 'multiSelect',
          options: JSON.parse(value) 
        } as MultiSelectValue;
      } catch (e) {
        console.error("Error parsing multiSelect value:", e);
        return { 
          type: 'multiSelect',
          options: [] 
        } as MultiSelectValue;
      }
    
    case 'singleSelect':
      return { 
        type: 'singleSelect',
        option: value 
      } as SingleSelectValue;
    
    default:
      return { type, value };
  }
};
