import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LeaveRequest } from '@/types';
import { StatusBadge } from '@/components/atoms/Badge/StatusBadge';
import { LeaveTypeBadge } from '@/components/atoms/Badge/LeaveTypeBadge';
import { UserAvatar } from '@/components/atoms/Avatar/UserAvatar';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ChevronRight, CheckCircle, XCircle, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface LeaveRequestCardProps {
  request: LeaveRequest;
  showActions?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => void;
  className?: string;
}

export const LeaveRequestCard: React.FC<LeaveRequestCardProps> = ({
  request,
  showActions = false,
  onApprove,
  onReject,
  onEdit,
  onCancel,
  className,
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const completedSteps = request.approvalSteps.filter(s => s.status !== 'pending').length;
  const totalSteps = request.approvalSteps.length;

  const isOwner = currentUser.id === request.employeeId;

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all cursor-pointer',
        className
      )}
      onClick={() => navigate(`/leave/${request.id}`)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <UserAvatar name={request.employeeName} size="md" />
          <div>
            <p className="font-semibold text-foreground">{request.employeeName}</p>
            <p className="text-sm text-muted-foreground line-clamp-1">{request.reason}</p>
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <LeaveTypeBadge type={request.leaveType} size="sm" />
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>
            {format(new Date(request.startDate), 'MMM d')} - {format(new Date(request.endDate), 'MMM d, yyyy')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{request.days} day{request.days > 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Approval Progress:</span>
            <div className="flex gap-1">
              {request.approvalSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    'w-6 h-1.5 rounded-full',
                    step.status === 'approved' && 'bg-blue-600',
                    step.status === 'rejected' && 'bg-destructive',
                    step.status === 'pending' && 'bg-muted'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {completedSteps}/{totalSteps}
            </span>
          </div>

          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {/* Edit and Cancel buttons - only enabled when status is pending AND current user is the owner */}
            {request.status === 'pending' && isOwner && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => onEdit?.(request.id)}
                  title="Edit Request"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => onCancel?.(request.id)}
                  title="Cancel Request"
                >
                  Cancel
                </Button>
              </>
            )}

            {/* Disabled Edit and Cancel buttons when approved or rejected - only for owner */}
            {(request.status === 'approved' || request.status === 'rejected') && isOwner && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 opacity-50 cursor-not-allowed"
                  disabled
                  title="Cannot edit after approval/rejection"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="opacity-50 cursor-not-allowed"
                  disabled
                  title="Cannot cancel after approval/rejection"
                >
                  Cancel
                </Button>
              </>
            )}

            {/* Approval action buttons for managers/admins */}
            {request.permissions?.canReject && (
              <Button
                size="icon"
                variant="outline"
                className="rounded-full w-8 h-8 text-destructive hover:text-white hover:bg-destructive"
                onClick={() => onReject?.(request.id)}
                title="Reject"
              >
                <XCircle className="w-5 h-5" />
              </Button>
            )}

            {request.permissions?.canApprove && (
              <Button
                size="icon"
                className="rounded-full w-8 h-8 bg-blue-600 hover:bg-blue-700 shadow-sm"
                onClick={() => onApprove?.(request.id)}
                title="Approve"
              >
                <CheckCircle className="w-5 h-5" />
              </Button>
            )}

            {/* Show chevron if no actions are available */}
            {!request.permissions?.canApprove && !request.permissions?.canReject && request.status !== 'pending' && request.status !== 'approved' && request.status !== 'rejected' && (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
