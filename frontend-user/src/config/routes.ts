// src/config/routes.ts
/**
 * Central route configuration for the WildRandom platform
 * Maintains consistent navigation paths across the application
 */
export const ROUTES = {
    public: {
      root: '/',
      auth: {
        login: '/auth/login',
        signup: '/auth/signup',
        verify: '/auth/verify',
        passwordReset: '/auth/reset-password'
      }
    },
    protected: {
      dashboard: '/dashboard',
      profile: '/profile',
      tickets: '/tickets',
      wins: '/wins'
    }
  } as const;
  
  /**
   * Type-safe route getter with built-in validation
   */
  export const getRoute = (path: keyof typeof ROUTES.protected | keyof typeof ROUTES.public.auth | 'root'): string => {
    if (path === 'root') return ROUTES.public.root;
    if (path in ROUTES.public.auth) return ROUTES.public.auth[path as keyof typeof ROUTES.public.auth];
    return ROUTES.protected[path as keyof typeof ROUTES.protected];
  };