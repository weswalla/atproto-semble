/**
 * Utility functions to format annotation values for API submission
 */

/**
 * Formats annotation values based on their type
 */
export const formatAnnotationValue = (type: string, value: string): any => {
  switch (type) {
    case 'rating':
      return { value: value === "" ? null : parseInt(value, 10) };
    
    case 'dyad':
      return { value: value === "" ? null : parseFloat(value) };
    
    case 'triad':
      try {
        const parsedValue = JSON.parse(value);
        return {
          vertexA: parsedValue.vertexA === "" ? null : parseFloat(parsedValue.vertexA),
          vertexB: parsedValue.vertexB === "" ? null : parseFloat(parsedValue.vertexB),
          vertexC: parsedValue.vertexC === "" ? null : parseFloat(parsedValue.vertexC)
        };
      } catch (e) {
        console.error("Error parsing triad value:", e);
        return { vertexA: null, vertexB: null, vertexC: null };
      }
    
    case 'multiSelect':
      try {
        return { options: JSON.parse(value) };
      } catch (e) {
        console.error("Error parsing multiSelect value:", e);
        return { options: [] };
      }
    
    case 'singleSelect':
      return { option: value };
    
    default:
      return { value };
  }
};
