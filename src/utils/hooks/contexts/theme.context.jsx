import React, { createContext, useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme, lightTheme } from '../../themes/theme.themes';

// Create Theme Context
const ThemeContext = createContext();


// Theme Context Provider Component
export const ThemeContextProvider = ({ children }) => {
  // Get saved theme from localStorage or default to 'dark'
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('themeMode');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Check system preference if no saved theme
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  // Set theme mode function
  const setThemeMode = (mode) => {
    setIsDarkMode(mode === 'dark');
  };

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('themeMode', isDarkMode ? 'dark' : 'light');
    
    // Update document class for additional styling if needed
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Only change if user hasn't set a preference
      const savedTheme = localStorage.getItem('themeMode');
      if (!savedTheme) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const contextValue = {
    isDarkMode,
    toggleTheme,
    setThemeMode,
    currentTheme,
    themeName: isDarkMode ? 'dark' : 'light',
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={currentTheme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext