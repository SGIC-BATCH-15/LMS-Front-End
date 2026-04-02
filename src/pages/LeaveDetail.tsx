import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { ApprovalTimeline } from '@/components/organisms/ApprovalTimeline/ApprovalTimeline';
import { StatusBadge } from '@/components/atoms/Badge/StatusBadge';
import { LeaveTypeBadge } from '@/components/atoms/Badge/LeaveTypeBadge';
import { UserAvatar } from '@/components/atoms/Avatar/UserAvatar';
import { UserCard } from '@/components/molecules/UserCard/UserCard';
import { users } from '@/data/mockData';
import { useLeaveRequests } from '@/context/LeaveRequestContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, Mail, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { getLeaveRequestById, LeaveRequestItem } from '@/components/services/leaveRequestService';
import { BackendEmployee } from '@/types';

export const LeaveDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { leaveRequests } = useLeaveRequests();

  const [backendRequest, setBackendRequest] = useState<LeaveRequestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [toRecipient, setToRecipient] = useState<BackendEmployee | null>(null);
  const [ccRecipients, setCcRecipients] = useState<BackendEmployee[]>([]);

  const request = leaveRequests.find(r => r.id === id);

  // Fetch backend data for To and Cc recipients
  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const requestId = parseInt(id);
        const response = await getLeaveRequestById(requestId);
        setBackendRequest(response);
        setToRecipient(response.toEmail);
        setCcRecipients(response.ccEmails || []);
      } catch (error) {
        console.error('Error fetching leave request details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [id]);

  if (!request) {
    return (
      <DashboardLayout title="Leave Request" showApplyButton={false}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Leave request not found</p>
          <Button className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Leave Request Details" showApplyButton={false}>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {/* Header Card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <UserAvatar name={request.employeeName} size="lg" />
              <div>
                <h2 className="text-xl font-semibold text-foreground">{request.employeeName}</h2>
                <p className="text-muted-foreground">Leave Request</p>
              </div>
            </div>
            <StatusBadge status={request.status} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Leave Type</p>
              <div className="mt-1">
                <LeaveTypeBadge type={request.leaveType} />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{request.days} day{request.days > 1 ? 's' : ''}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{format(new Date(request.startDate), 'MMM d, yyyy')}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">End Date</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{format(new Date(request.endDate), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-3">Reason</h3>
          <p className="text-muted-foreground">{request.reason}</p>
        </div>

        {/* Recipients */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">To</h3>
            </div>
            <div className="space-y-2">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : toRecipient ? (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <UserAvatar name={`${toRecipient.firstName} ${toRecipient.lastName}`} size="sm" />
                  <div>
                    <p className="font-medium text-sm">{`${toRecipient.firstName} ${toRecipient.lastName}`}</p>
                    <p className="text-xs text-muted-foreground">{toRecipient.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recipient found</p>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Cc</h3>
            </div>
            <div className="space-y-2">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : ccRecipients.length > 0 ? (
                ccRecipients.map(cc => (
                  <div key={cc.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <UserAvatar name={`${cc.firstName} ${cc.lastName}`} size="sm" />
                    <div>
                      <p className="font-medium text-sm">{`${cc.firstName} ${cc.lastName}`}</p>
                      <p className="text-xs text-muted-foreground">{cc.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No CC recipients</p>
              )}
            </div>
          </div>
        </div>

        {/* Approval Timeline */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-6">Approval Timeline</h3>
          <ApprovalTimeline steps={request.approvalSteps} currentStep={request.currentStep} />
        </div>

        {/* Timestamps */}
        <div className="text-sm text-muted-foreground text-center">
          <p>Created: {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}</p>
          <p>Last Updated: {format(new Date(request.updatedAt), 'MMM d, yyyy h:mm a')}</p>
        </div>
      </div>
    </DashboardLayout>
  );
};
