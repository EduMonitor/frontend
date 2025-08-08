import { useContext } from "react";
import ThemeContext from "./theme.context";

// Custom hook to use theme context
export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeContextProvider');
  }
  return context;
};