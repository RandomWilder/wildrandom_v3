// src/App.tsx

import { FC } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Provider as JotaiProvider } from 'jotai';
import { router } from './router';
import { GlobalErrorBoundary } from './components/common/ErrorBoundary';

/**
 * Root Application Component
 * Provides core application structure with global state management 
 * and error boundaries. Balance updates are handled at the transaction level,
 * not through continuous polling.
 */
const App: FC = () => {
  return (
    <JotaiProvider>
      <GlobalErrorBoundary>
        <RouterProvider router={router} />
      </GlobalErrorBoundary>
    </JotaiProvider>
  );
};

export default App;