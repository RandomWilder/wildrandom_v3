// src/router/index.tsx

import { createBrowserRouter, Navigate, RouteObject } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/home/HomePage';
import ProfilePage from '../pages/profile/ProfilePage';
import RafflePage from '../pages/raffles/[id]';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

/**
 * Public Routes Configuration
 * Defines routes accessible without authentication
 * 
 * Implementation Notes:
 * - Maintains consistent layout wrapper
 * - Supports dynamic route parameters
 * - Includes proper type definitions
 */
const publicRoutes: RouteObject[] = [
  {
    index: true,
    element: <HomePage />,
  },
  {
    path: 'raffles',
    children: [
      {
        index: true,
        element: <div>Featured Raffles</div>,
      },
      {
        path: ':id',
        element: <RafflePage />,
      }
    ]
  },
  {
    path: 'how-it-works',
    element: <div>How It Works</div>,
  },
];

/**
 * Protected Routes Configuration
 * Defines routes requiring authentication
 */
const protectedRoutes: RouteObject[] = [
  {
    path: 'profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
];

/**
 * Footer Routes Configuration
 * Static informational pages
 */
const footerRoutes: RouteObject[] = [
  {
    path: 'faq',
    element: <div>FAQ</div>,
  },
  {
    path: 'contact',
    element: <div>Contact Us</div>,
  },
  {
    path: 'terms',
    element: <div>Terms & Conditions</div>,
  },
];

/**
 * Root Router Configuration
 * Combines all route definitions under main layout
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      ...publicRoutes,
      ...protectedRoutes,
      ...footerRoutes,
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);