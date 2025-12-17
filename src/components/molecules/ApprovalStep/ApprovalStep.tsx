import React from 'react';
import { ApprovalStep as ApprovalStepType } from '@/types';
import { UserAvatar } from '@/components/atoms/Avatar/UserAvatar';
import { StatusBadge } from '@/components/atoms/Badge/StatusBadge';
import { Check, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ApprovalStepProps {
  step: ApprovalStepType;
  isLast: boolean;
  isCurrent: boolean;
}

export const ApprovalStepComponent: React.FC<ApprovalStepProps> = ({ step, isLast, isCurrent }) => {
  const getStatusIcon = () => {
    switch (step.status) {
      case 'approved':
        return <Check className="w-4 h-4 text-success" />;
      case 'rejected':
        return <X className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-warning" />;
    }
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center border-2',
            step.status === 'approved' && 'bg-success/10 border-success',
            step.status === 'rejected' && 'bg-destructive/10 border-destructive',
            step.status === 'pending' && 'bg-warning/10 border-warning'
          )}
        >
          {getStatusIcon()}
        </div>
        {!isLast && (
          <div
            className={cn(
              'w-0.5 flex-1 my-2',
              step.status === 'approved' ? 'bg-success' : 'bg-border'
            )}
          />
        )}
      </div>

      <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-foreground">{step.approverName}</p>
            <p className="text-sm text-muted-foreground">{step.approverRole}</p>
          </div>
          <StatusBadge status={step.status} size="sm" />
        </div>

        {step.comment && (
          <div className="mt-2 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-foreground">{step.comment}</p>
          </div>
        )}

        {step.actionDate && (
          <p className="mt-2 text-xs text-muted-foreground">
            {format(new Date(step.actionDate), 'MMM d, yyyy h:mm a')}
          </p>
        )}

        {step.status === 'pending' && isCurrent && (
          <p className="mt-2 text-xs text-warning font-medium">Awaiting response...</p>
        )}
      </div>
    </div>
  );
};
