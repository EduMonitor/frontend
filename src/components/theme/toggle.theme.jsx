import { useThemeMode } from "../../utils/hooks/contexts/useTheme.context";

const ThemeToggleButton = () => {
  const { isDarkMode, toggleTheme } = useThemeMode();
  
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      style={{
        position: 'fixed',
        top: '50%',
        right: '1rem',
        transform: 'translateY(-50%)',
        width: '3.5rem',
        height: '3.5rem',
        border: 'none',
        borderRadius: '50%',
        backgroundColor: isDarkMode ? '#ffffff' : '#1a1a1a',
        color: isDarkMode ? '#1a1a1a' : '#ffffff',
        cursor: 'pointer',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.25rem',
        boxShadow: isDarkMode 
          ? '0 4px 12px rgba(0, 0, 0, 0.15)' 
          : '0 4px 12px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease',
        outline: 'none',
        // Hover effects
        ':hover': {
          transform: 'scale(1.1)',
          boxShadow: isDarkMode 
            ? '0 6px 16px rgba(0, 0, 0, 0.2)' 
            : '0 6px 16px rgba(0, 0, 0, 0.4)',
        },
        // Focus effects for accessibility
        ':focus': {
          outline: '2px solid #007acc',
          outlineOffset: '2px',
        },
        // Active effects
        ':active': {
          transform: 'scale(0.95)',
        }
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'scale(1.1)';
        e.target.style.boxShadow = isDarkMode 
          ? '0 6px 16px rgba(0, 0, 0, 0.2)' 
          : '0 6px 16px rgba(0, 0, 0, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'scale(1)';
        e.target.style.boxShadow = isDarkMode 
          ? '0 4px 12px rgba(0, 0, 0, 0.15)' 
          : '0 4px 12px rgba(0, 0, 0, 0.3)';
      }}
      onMouseDown={(e) => {
        e.target.style.transform = 'scale(0.95)';
      }}
      onMouseUp={(e) => {
        e.target.style.transform = 'scale(1.1)';
      }}
    >
      {isDarkMode ? '☀️' : '🌙'}
    </button>
  );
};

export default ThemeToggleButton;