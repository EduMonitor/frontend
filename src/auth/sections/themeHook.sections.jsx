// hooks/useAuthTheme.js
import { useMemo } from 'react';
import { useThemeMode } from '../../utils/hooks/contexts/useTheme.context';

const useAuthTheme = () => {
  const { isDarkMode } = useThemeMode();

  const theme = useMemo(() => ({
    background: isDarkMode 
      ? 'linear-gradient(135deg, #0F0F23 0%, #1A1A2E 50%, #16213E 100%)'
      : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
    cardBg: isDarkMode 
      ? 'rgba(255, 255, 255, 0.05)' 
      : 'rgba(255, 255, 255, 0.98)',
    textPrimary: isDarkMode 
      ? '#FFFFFF' 
      : '#1a202c',
    textSecondary: isDarkMode 
      ? '#B8BCC8' 
      : '#4a5568',
    accent: '#4A90E2',
    // Additional colors for better light theme support
    inputBorder: isDarkMode 
      ? 'rgba(255, 255, 255, 0.2)' 
      : 'rgba(26, 32, 44, 0.15)',
    inputFocus: isDarkMode 
      ? '#4A90E2' 
      : '#3182ce',
    shadow: isDarkMode 
      ? 'rgba(0, 0, 0, 0.3)' 
      : 'rgba(0, 0, 0, 0.1)',
  }), [isDarkMode]);

  return theme;
};

export default useAuthTheme;