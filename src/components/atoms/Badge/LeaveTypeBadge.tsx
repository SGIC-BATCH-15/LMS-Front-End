import React from 'react';
import { LeaveType } from '@/types';
import { cn } from '@/lib/utils';
import { Palmtree, Coffee, Thermometer, Baby, Heart, Calendar } from 'lucide-react';

interface LeaveTypeBadgeProps {
  type: LeaveType;
  size?: 'sm' | 'md';
}

const typeConfig: Record<LeaveType, { label: string; icon: React.ElementType; className: string }> = {
  annual: { label: 'Annual', icon: Palmtree, className: 'bg-primary/10 text-primary border-primary/20' },
  casual: { label: 'Casual', icon: Coffee, className: 'bg-accent/10 text-accent-foreground border-accent/20' },
  sick: { label: 'Sick', icon: Thermometer, className: 'bg-destructive/10 text-destructive border-destructive/20' },
  maternity: { label: 'Maternity', icon: Baby, className: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
  paternity: { label: 'Paternity', icon: Heart, className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  unpaid: { label: 'Unpaid', icon: Calendar, className: 'bg-muted text-muted-foreground border-border' },
};

export const LeaveTypeBadge: React.FC<LeaveTypeBadgeProps> = ({ type, size = 'md' }) => {
  const config = typeConfig[type];
  const Icon = config.icon;
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        config.className
      )}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {config.label}
    </span>
  );
};
