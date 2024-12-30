import React from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

// Size configuration type definition
type AvatarSize = 'sm' | 'md' | 'lg';

// Size mappings interface
interface SizeMapping {
  container: string;
  icon: string;
  text: string;
}

// Core props interface
interface UserAvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  size?: AvatarSize;
  className?: string;
}

// Size configuration mappings
const SIZE_MAPPINGS: Record<AvatarSize, SizeMapping> = {
  sm: {
    container: 'h-8 w-8',
    icon: 'h-4 w-4',
    text: 'text-sm'
  },
  md: {
    container: 'h-10 w-10',
    icon: 'h-5 w-5',
    text: 'text-base'
  },
  lg: {
    container: 'h-12 w-12',
    icon: 'h-6 w-6',
    text: 'text-lg'
  }
};

// Color configuration for avatar backgrounds
const AVATAR_COLORS: Array<{ bg: string; text: string }> = [
  { bg: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-green-100', text: 'text-green-700' },
  { bg: 'bg-purple-100', text: 'text-purple-700' },
  { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  { bg: 'bg-red-100', text: 'text-red-700' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700' }
];

export const UserAvatar: React.FC<UserAvatarProps> = ({
  firstName,
  lastName,
  email,
  size = 'md',
  className
}) => {
  // Generate display text from user details
  const getDisplayText = (): string => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (lastName) {
      return lastName[0].toUpperCase();
    }
    return email[0].toUpperCase();
  };

  // Generate consistent color based on email
  const getColorClasses = (): { bg: string; text: string } => {
    const index = email
      .toLowerCase()
      .split('')
      .reduce((acc, char) => char.charCodeAt(0) + acc, 0) % AVATAR_COLORS.length;
    
    return AVATAR_COLORS[index];
  };

  const hasName = Boolean(firstName || lastName);
  const sizeClasses = SIZE_MAPPINGS[size];
  const colorClasses = getColorClasses();
  const displayName = `${firstName || ''} ${lastName || ''}`.trim() || email;

  return (
    <div
      className={cn(
        'relative rounded-full flex items-center justify-center',
        sizeClasses.container,
        hasName ? `${colorClasses.bg} ${colorClasses.text}` : 'bg-gray-100',
        className
      )}
      title={displayName}
    >
      {hasName ? (
        <span className={cn('font-medium', sizeClasses.text)}>
          {getDisplayText()}
        </span>
      ) : (
        <User 
          className={cn('text-gray-500', sizeClasses.icon)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default UserAvatar;