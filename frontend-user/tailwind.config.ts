// tailwind.config.ts
const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'surface': {
          dark: '#0F172A',    // Deep background
          card: '#1E293B',    // Card backgrounds
          hover: '#334155'    // Interactive elements
        },
        'game': {
          400: '#818CF8',     // Bright accents
          500: '#6366F1',     // Primary actions
          600: '#4F46E5',     // Hover states
          700: '#4338CA',     // Active states
        },
        'accent': {
          success: '#10B981', // Success states
          error: '#EF4444',   // Error states
          warning: '#F59E0B', // Warning states
          info: '#3B82F6'     // Info states
        }
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'card-hover': 'card-hover 0.3s ease-out'
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            'box-shadow': '0 0 0 0 rgba(99, 102, 241, 0.4)'
          },
          '50%': {
            'box-shadow': '0 0 20px 0 rgba(99, 102, 241, 0.2)'
          }
        },
        'shimmer': {
          '0%': {
            'background-position': '-200% 0'
          },
          '100%': {
            'background-position': '200% 0'
          }
        },
        'card-hover': {
          '0%': {
            transform: 'translateY(0)',
          },
          '100%': {
            transform: 'translateY(-4px)',
          }
        }
      },
      transitionTimingFunction: {
        'gaming': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      }
    }
  },
  plugins: [
    require("tailwindcss-animate")
  ]
}