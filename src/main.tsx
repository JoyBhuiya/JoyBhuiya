import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import '@fontsource/familjen-grotesk/400.css';
import '@fontsource/familjen-grotesk/600.css';
import '@fontsource-variable/public-sans';
import '@fontsource/dm-mono/500.css';
import './styles/index.css';
import { router } from './routes';
import { ProgressProvider } from './state/ProgressContext';
import { ThemeProvider } from './state/ThemeContext';
import { AnnounceProvider } from './hooks/useAnnounce';
import { SessionProvider } from './state/SessionContext';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

createRoot(container).render(
  <StrictMode>
    <ProgressProvider>
      <ThemeProvider>
        <AnnounceProvider>
          <SessionProvider>
            <RouterProvider router={router} />
          </SessionProvider>
        </AnnounceProvider>
      </ThemeProvider>
    </ProgressProvider>
  </StrictMode>,
);
