const colorPalette = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7B801', '#5FAD56', 
  '#F26419', '#2E9335', '#D81159', '#8F2D56', '#F9A620', 
  '#218380', '#E84855', '#7CB518', '#34A853', '#FABC05',
  '#EA4335', '#4285F4', '#9334E6', '#FBBC04', '#34A853'
];

const textToColor = (text) => {
  if (!text) return colorPalette[0];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; 
  }
  const index = Math.abs(hash) % colorPalette.length;
  return colorPalette[index];
};

export const getAnnotationColor = (annotation) => {
  const key = annotation.code_name || annotation.id.toString();
  return textToColor(key);
};
