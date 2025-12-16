import React from 'react';
import { User } from '@/types';
import { UserAvatar } from '@/components/atoms/Avatar/UserAvatar';
import { departments } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface UserCardProps {
  user: User;
  showRole?: boolean;
  showDepartment?: boolean;
  compact?: boolean;
  onClick?: () => void;
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  showRole = true,
  showDepartment = false,
  compact = false,
  onClick,
  className,
}) => {
  const department = departments.find(d => d.id === user.departmentId);

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2',
          onClick && 'cursor-pointer hover:opacity-80',
          className
        )}
        onClick={onClick}
      >
        <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
        <span className="text-sm font-medium text-foreground">{user.name}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg',
        onClick && 'cursor-pointer hover:bg-accent/50 transition-colors',
        className
      )}
      onClick={onClick}
    >
      <UserAvatar name={user.name} avatar={user.avatar} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{user.name}</p>
        <p className="text-sm text-muted-foreground truncate">
          {showRole && user.designation}
          {showDepartment && department && ` • ${department.name}`}
        </p>
      </div>
    </div>
  );
};
