export const truncateText = (text: string, maxLength: number = 100) => {
  if (typeof maxLength !== 'number' || text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength) + '...';
};
