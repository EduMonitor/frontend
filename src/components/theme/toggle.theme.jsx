import { useThemeMode } from '../../utils/hooks/contexts/useTheme.context';

const ThemeToggleButton = () => {
  const { isDarkMode, toggleTheme } = useThemeMode();

  return (
    <button
      onClick={toggleTheme}
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        padding: '0.5rem 1rem',
        border: 'none',
        borderRadius: '5px',
        backgroundColor: isDarkMode ? '#f1f1f1' : '#333',
        color: isDarkMode ? '#000' : '#fff',
        cursor: 'pointer',
        zIndex: 9999
      }}
    >
      {isDarkMode ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
};

export default ThemeToggleButton;
