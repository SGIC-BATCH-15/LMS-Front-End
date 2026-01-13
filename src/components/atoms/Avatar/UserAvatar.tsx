import React from 'react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getColorFromName = (name: string): string => {
  const colors = [
    'bg-primary',
    'bg-accent',
    'bg-success',
    'bg-warning',
    'bg-info',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ name, avatar, size = 'md', className }) => {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={cn('rounded-full object-cover', sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-primary-foreground',
        sizeClasses[size],
        getColorFromName(name),
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
};
