import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { CssBaseline, GlobalStyles, ThemeProvider } from '@mui/material'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { disableReactDevTools } from '@fvilers/disable-react-devtools';
import { ThemeContextProvider } from './utils/hooks/contexts/theme.context.jsx'
if (import.meta.env.VITE_APP_ENV === "production") {
  disableReactDevTools();
  console.warn = () => { };
  console.error = () => { };
}
const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <ThemeContextProvider>
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
       
      </ThemeContextProvider>
  </StrictMode>
)
