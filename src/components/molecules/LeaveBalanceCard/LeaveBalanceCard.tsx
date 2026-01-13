import React from 'react';
import { LeaveBalance, LeaveType } from '@/types';
import { LeaveTypeBadge } from '@/components/atoms/Badge/LeaveTypeBadge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface LeaveBalanceCardProps {
  balance: LeaveBalance;
  className?: string;
}

export const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({ balance, className }) => {
  const available = balance.total - balance.used - balance.pending;
  const usedPercentage = (balance.used / balance.total) * 100;
  const pendingPercentage = (balance.pending / balance.total) * 100;

  return (
    <div className={cn('bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow', className)}>
      <div className="flex items-center justify-between mb-4">
        <LeaveTypeBadge type={balance.leaveType} />
        <span className="text-2xl font-bold text-foreground">{available}</span>
      </div>
      
      <div className="space-y-2">
        <Progress value={usedPercentage + pendingPercentage} className="h-2" />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Available: {available}</span>
          <span>Total: {balance.total}</span>
        </div>
        
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span className="text-muted-foreground">Used: {balance.used}</span>
          </div>
          {balance.pending > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-warning"></span>
              <span className="text-muted-foreground">Pending: {balance.pending}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
