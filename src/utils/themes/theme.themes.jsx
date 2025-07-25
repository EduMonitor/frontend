import { createTheme, alpha } from '@mui/material/styles';

// Custom shadows for better depth perception
const customShadows = [
    'none',
    'hsla(220, 30%, 5%, 0.7) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.8) 0px 8px 16px -5px',
    'hsla(220, 30%, 5%, 0.4) 0px 1px 3px 0px, hsla(220, 20%, 20%, 0.6) 0px 1px 2px -1px',
    'hsla(220, 30%, 5%, 0.4) 0px 3px 6px 0px, hsla(220, 20%, 20%, 0.5) 0px 3px 6px -2px',
    'hsla(220, 30%, 5%, 0.4) 0px 6px 10px 0px, hsla(220, 20%, 20%, 0.4) 0px 5px 8px -4px',
    'hsla(220, 30%, 5%, 0.4) 0px 8px 12px 0px, hsla(220, 20%, 20%, 0.3) 0px 6px 10px -5px',
    'hsla(220, 30%, 5%, 0.4) 0px 10px 15px 0px, hsla(220, 20%, 20%, 0.2) 0px 7px 12px -6px',
    'hsla(220, 30%, 5%, 0.3) 0px 12px 17px 0px, hsla(220, 20%, 20%, 0.15) 0px 8px 14px -7px',
    'hsla(220, 30%, 5%, 0.3) 0px 14px 20px 0px, hsla(220, 20%, 20%, 0.1) 0px 9px 16px -8px',
    'hsla(220, 30%, 5%, 0.25) 0px 16px 24px 0px, hsla(220, 20%, 20%, 0.08) 0px 10px 18px -9px',
];

// Light theme shadows
const lightShadows = [
    'none',
    'hsla(220, 30%, 5%, 0.1) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.15) 0px 8px 16px -5px',
    'hsla(220, 30%, 5%, 0.07) 0px 1px 3px 0px, hsla(220, 20%, 20%, 0.1) 0px 1px 2px -1px',
    'hsla(220, 30%, 5%, 0.07) 0px 3px 6px 0px, hsla(220, 20%, 20%, 0.09) 0px 3px 6px -2px',
    'hsla(220, 30%, 5%, 0.07) 0px 6px 10px 0px, hsla(220, 20%, 20%, 0.08) 0px 5px 8px -4px',
    'hsla(220, 30%, 5%, 0.07) 0px 8px 12px 0px, hsla(220, 20%, 20%, 0.07) 0px 6px 10px -5px',
    'hsla(220, 30%, 5%, 0.07) 0px 10px 15px 0px, hsla(220, 20%, 20%, 0.06) 0px 7px 12px -6px',
    'hsla(220, 30%, 5%, 0.06) 0px 12px 17px 0px, hsla(220, 20%, 20%, 0.05) 0px 8px 14px -7px',
    'hsla(220, 30%, 5%, 0.06) 0px 14px 20px 0px, hsla(220, 20%, 20%, 0.04) 0px 9px 16px -8px',
    'hsla(220, 30%, 5%, 0.05) 0px 16px 24px 0px, hsla(220, 20%, 20%, 0.03) 0px 10px 18px -9px',
];

// Color palette definitions
const blue = {
    50: 'hsl(210, 100%, 97%)',
    100: 'hsl(210, 100%, 94%)',
    200: 'hsl(210, 100%, 87%)',
    300: 'hsl(210, 100%, 78%)',
    400: 'hsl(210, 100%, 68%)',
    500: 'hsl(210, 100%, 58%)', // Primary blue
    600: 'hsl(210, 100%, 48%)',
    700: 'hsl(210, 100%, 38%)',
    800: 'hsl(210, 100%, 28%)',
    900: 'hsl(210, 100%, 18%)',
};

const green = {
    50: 'hsl(142, 60%, 95%)',
    100: 'hsl(142, 60%, 89%)',
    200: 'hsl(142, 60%, 78%)',
    300: 'hsl(142, 60%, 65%)',
    400: 'hsl(142, 60%, 52%)',
    500: 'hsl(142, 60%, 45%)',
    600: 'hsl(142, 60%, 38%)',
    700: 'hsl(142, 60%, 30%)',
    800: 'hsl(142, 60%, 22%)',
    900: 'hsl(142, 60%, 15%)',
};

const gray = {
    50: 'hsl(220, 35%, 97%)',
    100: 'hsl(220, 30%, 94%)',
    200: 'hsl(220, 20%, 88%)',
    300: 'hsl(220, 20%, 80%)',
    400: 'hsl(220, 20%, 65%)',
    500: 'hsl(220, 20%, 42%)',
    600: 'hsl(220, 20%, 35%)',
    700: 'hsl(220, 20%, 25%)',
    800: 'hsl(220, 30%, 6%)',
    900: 'hsl(220, 35%, 3%)',
};

const orange = {
    50: 'hsl(30, 100%, 96%)',
    100: 'hsl(30, 100%, 91%)',
    200: 'hsl(30, 100%, 82%)',
    300: 'hsl(30, 100%, 71%)',
    400: 'hsl(30, 100%, 60%)',
    500: 'hsl(30, 100%, 50%)',
    600: 'hsl(30, 100%, 45%)',
    700: 'hsl(30, 100%, 38%)',
    800: 'hsl(30, 100%, 30%)',
    900: 'hsl(30, 100%, 22%)',
};

const purple = {
    50: 'hsl(270, 60%, 96%)',
    100: 'hsl(270, 60%, 91%)',
    200: 'hsl(270, 60%, 82%)',
    300: 'hsl(270, 60%, 71%)',
    400: 'hsl(270, 60%, 60%)',
    500: 'hsl(270, 60%, 50%)',
    600: 'hsl(270, 60%, 42%)',
    700: 'hsl(270, 60%, 34%)',
    800: 'hsl(270, 60%, 26%)',
    900: 'hsl(270, 60%, 18%)',
};

const red = {
    50: 'hsl(0, 100%, 96%)',
    100: 'hsl(0, 100%, 91%)',
    200: 'hsl(0, 100%, 82%)',
    300: 'hsl(0, 100%, 71%)',
    400: 'hsl(0, 100%, 60%)',
    500: 'hsl(0, 84%, 52%)',
    600: 'hsl(0, 84%, 46%)',
    700: 'hsl(0, 84%, 40%)',
    800: 'hsl(0, 84%, 34%)',
    900: 'hsl(0, 84%, 28%)',
};

// Shared typography configuration
const typography = {
    fontFamily: ['"Poppins"', '"Inter"', '"Roboto"', 'sans-serif'].join(','),
    h1: {
        fontSize: '3rem',
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: '2.25rem',
        fontWeight: 600,
        lineHeight: 1.2,
    },
    h3: {
        fontSize: '1.875rem',
        fontWeight: 500,
        lineHeight: 1.2,
    },
    h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.5,
    },
    h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
    },
    h6: {
        fontSize: '1.125rem',
        fontWeight: 600,
    },
    subtitle1: {
        fontSize: '1.125rem',
        fontWeight: 400,
    },
    subtitle2: {
        fontSize: '0.875rem',
        fontWeight: 500,
    },
    body1: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
    },
    body2: {
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: 1.4,
    },
    caption: {
        fontSize: '0.75rem',
        fontWeight: 400,
    },
};

// Shared component styles
const getComponents = (mode) => ({
    MuiButton: {
        styleOverrides: {
            root: {
                fontWeight: 600,
                fontFamily: 'Poppins',
                textTransform: 'none',
                borderRadius: 8,
            },
        }
    },
    MuiTypography: {
        styleOverrides: {
            root: {
                fontFamily: 'Poppins',
            },
        },
    },
    MuiInputBase: {
        styleOverrides: {
            root: {
                fontFamily: 'Poppins',
            },
        },
    },
    MuiOutlinedInput: {
        styleOverrides: {
            root: {
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: blue[500],
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: mode === 'dark' ? blue[400] : blue[600],
                },
            },
        },
    },
    MuiInput: {
        styleOverrides: {
            underline: {
                '&:after': {
                    borderBottomColor: blue[500],
                },
                '&:hover:not(.Mui-disabled):before': {
                    borderBottomColor: mode === 'dark' ? blue[400] : blue[600],
                },
            },
        },
    },
    MuiInputLabel: {
        styleOverrides: {
            root: {
                color: mode === 'dark' ? gray[400] : gray[600],
                '&.Mui-focused': {
                    color: blue[500],
                },
            },
        },
    },
    MuiLink: {
        styleOverrides: {
            root: {
                fontWeight: 500,
                fontFamily: 'Poppins',
                color: blue[500],
                textDecoration: 'none',
                '&:hover': {
                    textDecoration: 'underline',
                },
            },
        },
    },
    MuiCard: {
        styleOverrides: {
            root: {
                borderRadius: 12,
            },
        },
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                borderRadius: 8,
            },
        },
    },
});

// Dark Theme
export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: blue[500],
            light: blue[400],
            dark: blue[600],
            contrastText: '#ffffff',
        },
        secondary: {
            light: purple[300],
            main: purple[500],
            dark: purple[700],
            contrastText: purple[50],
        },
        tertiary: {
            light: orange[300],
            main: orange[500],
            dark: orange[700],
            contrastText: orange[50],
        },
        info: {
            light: blue[300],
            main: blue[400],
            dark: blue[600],
            contrastText: '#ffffff',
        },
        warning: {
            light: orange[400],
            main: orange[500],
            dark: orange[600],
            contrastText: '#ffffff',
        },
        error: {
            light: red[400],
            main: red[500],
            dark: red[700],
            contrastText: '#ffffff',
        },
        success: {
            light: green[400],
            main: green[500],
            dark: green[700],
            contrastText: '#ffffff',
        },
        grey: gray,
        divider: alpha(gray[600], 0.3),
        sidebar: 'hsl(220, 45%, 8%)',
        background: {
            default: 'hsl(220, 30%, 10%)',
            paper: 'hsl(220, 35%, 12%)',
        },
        text: {
            primary: 'hsl(0, 0%, 98%)',
            secondary: gray[400],
            disabled: gray[600],
        },
        action: {
            hover: alpha(blue[500], 0.08),
            selected: alpha(blue[500], 0.16),
            disabled: alpha(gray[500], 0.3),
            disabledBackground: alpha(gray[500], 0.12),
        },
    },
    typography,
    shape: {
        borderRadius: 8,
    },
    shadows: customShadows,
    components: getComponents('dark'),
});

// Light Theme
export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: blue[600],
            light: blue[400],
            dark: blue[800],
            contrastText: '#ffffff',
        },
        secondary: {
            light: purple[300],
            main: purple[600],
            dark: purple[800],
            contrastText: '#ffffff',
        },
        tertiary: {
            light: orange[300],
            main: orange[600],
            dark: orange[800],
            contrastText: '#ffffff',
        },
        info: {
            light: blue[300],
            main: blue[500],
            dark: blue[700],
            contrastText: '#ffffff',
        },
        warning: {
            light: orange[300],
            main: orange[500],
            dark: orange[700],
            contrastText: '#ffffff',
        },
        error: {
            light: red[300],
            main: red[500],
            dark: red[700],
            contrastText: '#ffffff',
        },
        success: {
            light: green[300],
            main: green[500],
            dark: green[700],
            contrastText: '#ffffff',
        },
        grey: gray,
        divider: alpha(gray[300], 0.4),
        sidebar: 'hsl(220, 20%, 96%)',
        background: {
            default: 'hsl(220, 20%, 98%)',
            paper: '#ffffff',
        },
        text: {
            primary: 'hsl(220, 20%, 15%)',
            secondary: gray[600],
            disabled: gray[400],
        },
        action: {
            hover: alpha(blue[500], 0.04),
            selected: alpha(blue[500], 0.08),
            disabled: alpha(gray[500], 0.26),
            disabledBackground: alpha(gray[500], 0.12),
        },
    },
    typography,
    shape: {
        borderRadius: 8,
    },
    shadows: lightShadows,
    components: getComponents('light'),
});

