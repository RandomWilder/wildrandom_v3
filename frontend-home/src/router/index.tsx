// src/router/index.tsx

import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/home/HomePage';
import ProfilePage from '../pages/profile/ProfilePage';
import RafflePage from '../pages/raffles/[id]';
import RaffleTicketsPage from '../pages/raffles/[id]/tickets'; // Added import
import MyTicketsPage from '../pages/my-tickets';
import MyTixPage from '../pages/my-tix'; 
import { FeatureErrorBoundary } from '../components/common/ErrorBoundary';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

/**
 * Application Router Configuration
 * 
 * Implements comprehensive routing with session-aware navigation patterns
 * and proper error boundary integration for robust failure recovery.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <FeatureErrorBoundary feature="Application" />,
    id: 'root-layout',
    children: [
      // Home Route - Primary entry point
      {
        index: true,
        element: <HomePage />,
        id: 'home'
      },

      // Raffle Routes - Dynamic game content
      {
        path: 'raffles/:id',
        element: <RafflePage />,
        id: 'raffle-detail',
        errorElement: <FeatureErrorBoundary feature="Raffle" />
      },

      // Raffle Tickets Route - Added for ticket grid view
      {
        path: 'raffles/:id/tickets',
        element: <RaffleTicketsPage />,
        id: 'raffle-tickets',
        errorElement: <FeatureErrorBoundary feature="Raffle Tickets" />
      },

      // New Test Route - Unprotected for testing
      {
        path: 'my-tix',
        element: <MyTixPage />,
        id: 'my-tix'
      },

      // Original Protected Routes
      {
        path: 'my-tickets',
        element: (
          <ProtectedRoute fallbackPath="/">
            <FeatureErrorBoundary feature="My Tickets">
              <MyTicketsPage />
            </FeatureErrorBoundary>
          </ProtectedRoute>
        ),
        id: 'my-tickets'
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute fallbackPath="/">
            <FeatureErrorBoundary feature="Profile">
              <ProfilePage />
            </FeatureErrorBoundary>
          </ProtectedRoute>
        ),
        id: 'user-profile'
      },

      // Fallback Route - Navigation recovery
      {
        path: '*',
        element: <Navigate to="/" replace />,
        id: 'fallback'
      }
    ]
  }
]);

export default router;