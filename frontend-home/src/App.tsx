// File: /src/App.tsx

import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { GlobalErrorBoundary } from './components/common/ErrorBoundary';

function App() {
  return (
    <GlobalErrorBoundary>
      <RouterProvider router={router} />
    </GlobalErrorBoundary>
  );
}

export default App;