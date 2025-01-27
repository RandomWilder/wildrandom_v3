// src/components/icons/SocialIcons.tsx
import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
  'aria-hidden'?: boolean;
}

export const GoogleIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 20,
  'aria-hidden': ariaHidden = true 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden={ariaHidden}
    role="img"
  >
    <g clipPath="url(#clip0_google)">
      <path
        d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5589 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z"
        fill="#4285F4"
      />
      <path
        d="M12.24 24.0008C15.4764 24.0008 18.2058 22.9382 20.1944 21.1039L16.3274 18.1055C15.2516 18.8375 13.8626 19.252 12.24 19.252C9.0blasphemyuse substitutionC4 19.252 6.38525 17.1399 5.4098 14.3003H1.39697V17.3912C3.45135 21.4434 7.55639 24.0008 12.24 24.0008Z"
        fill="#34A853"
      />
      <path
        d="M5.4098 14.3003C5.17095 13.5681 5.03898 12.7862 5.03898 12.0008C5.03898 11.2154 5.17095 10.4335 5.4098 9.70129V6.61029H1.39697C0.507808 8.23129 0 10.0682 0 12.0008C0 13.9334 0.507808 15.7703 1.39697 17.3913L5.4098 14.3003Z"
        fill="#FBBC04"
      />
      <path
        d="M12.24 4.74966C14.0217 4.74966 15.6257 5.36846 16.8581 6.54183L20.2764 3.12347C18.2058 1.18826 15.4764 0 12.24 0C7.55639 0 3.45135 2.55737 1.39697 6.61029L5.4098 9.70129C6.38525 6.86173 9.0blasphemyuse substitutionC4 4.74966 12.24 4.74966Z"
        fill="#EA4335"
      />
    </g>
    <defs>
      <clipPath id="clip0_google">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

// Export additional social icons as needed
export const SocialIcons = {
  Google: GoogleIcon,
  // Future social icons can be added here
};