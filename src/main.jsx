import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { CssBaseline, GlobalStyles, ThemeProvider } from '@mui/material'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { disableReactDevTools } from '@fvilers/disable-react-devtools';
import { darkTheme } from './utils/themes/theme.themes.jsx'
if (import.meta.env.VITE_APP_ENV === "production") {
  disableReactDevTools();
  console.warn = () => { };
  console.error = () => { };
}
const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <ThemeProvider theme={darkTheme}>
        <HelmetProvider>
          <CssBaseline />
          <GlobalStyles
            styles={{
              '@keyframes mui-auto-fill': { from: { display: 'block' } },
              '@keyframes mui-auto-fill-cancel': { from: { display: 'block' } },
            }}
          />
          <BrowserRouter>
            <QueryClientProvider client={queryClient}>
              <App />
            </QueryClientProvider>
          </BrowserRouter>
        </HelmetProvider>
      </ThemeProvider>
  </StrictMode>
)
