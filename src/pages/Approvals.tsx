import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useLeaveRequests } from '@/context/LeaveRequestContext';
import { LeaveRequestCard } from '@/components/organisms/LeaveRequestCard/LeaveRequestCard';
import { StatCard } from '@/components/molecules/StatCard/StatCard';
import { useRolePrivilege } from '@/context/RolePrivilegeContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { LeaveRequest } from '@/types';
import {
  getPendingApprovals,
  approveLeaveRequest,
  rejectLeaveRequest,
  LeaveRequestItem
} from '@/components/services/leaveRequestService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Helper function to map backend leave type to frontend format
const mapLeaveType = (backendType: string): any => {
  const typeMap: Record<string, string> = {
    'annual leave': 'annual',
    'annual': 'annual',
    'casual leave': 'casual',
    'casual': 'casual',
    'sick leave': 'sick',
    'sick': 'sick',
    'maternity leave': 'maternity',
    'maternity': 'maternity',
    'paternity leave': 'paternity',
    'paternity': 'paternity',
    'unpaid leave': 'unpaid',
    'unpaid': 'unpaid',
  };

  const normalizedType = backendType.toLowerCase().trim();
  return typeMap[normalizedType] || 'casual'; // Default to 'casual' if no match
};

// Helper function to transform backend leave request to frontend format
const transformLeaveRequest = (item: LeaveRequestItem): LeaveRequest => {
  // Build approval steps from backend data
  const approvalSteps = [];

  // Log for debugging
  console.log('Transform leave request:', {
    id: item.id,
    status: item.status,
    approvedBy: item.approvedBy,
    rejectedBy: item.rejectedBy,
    toEmail: item.toEmail,
    ccEmails: item.ccEmails
  });

  // Determine status for TO recipient
  let toStatus: 'pending' | 'approved' | 'rejected' = 'pending';
  if (item.status.toLowerCase() === 'approved') {
    // If approvedBy is provided, check if it matches TO email
    if (item.approvedBy) {
      toStatus = item.approvedBy.id === item.toEmail.id ? 'approved' : 'pending';
    } else {
      // Fallback: if no approvedBy info, mark TO as approved (backward compatibility)
      toStatus = 'approved';
    }
  } else if (item.status.toLowerCase() === 'rejected') {
    // If rejectedBy is provided, check if it matches TO email
    if (item.rejectedBy) {
      toStatus = item.rejectedBy.id === item.toEmail.id ? 'rejected' : 'pending';
    } else {
      // Fallback: if no rejectedBy info, mark TO as rejected (backward compatibility)
      toStatus = 'rejected';
    }
  }

  // Add TO recipient as primary approver
  const toStep = {
    id: `step-${item.id}-to`,
    approverId: item.toEmail.id.toString(),
    approverName: `${item.toEmail.firstName} ${item.toEmail.lastName}`,
    approverRole: 'Primary Approver',
    status: toStatus,
    actionDate: toStatus === 'approved' ? item.approvedAt :
      toStatus === 'rejected' ? item.rejectedAt : undefined,
    comment: item.comments,
    order: 1,
  };
  approvalSteps.push(toStep);

  // Add CC recipients as secondary approvers/reviewers
  item.ccEmails.forEach((cc, index) => {
    // Determine status for CC recipient
    let ccStatus: 'pending' | 'approved' | 'rejected' = 'pending';
    if (item.status.toLowerCase() === 'approved' && item.approvedBy?.id === cc.id) {
      ccStatus = 'approved';
    } else if (item.status.toLowerCase() === 'rejected' && item.rejectedBy?.id === cc.id) {
      ccStatus = 'rejected';
    }

    const ccStep = {
      id: `step-${item.id}-cc-${cc.id}`,
      approverId: cc.id.toString(),
      approverName: `${cc.firstName} ${cc.lastName}`,
      approverRole: 'Reviewer (CC)',
      status: ccStatus,
      actionDate: ccStatus === 'approved' ? item.approvedAt :
        ccStatus === 'rejected' ? item.rejectedAt : undefined,
      comment: item.comments,
      order: index + 2,
    };
    approvalSteps.push(ccStep);
  });

  return {
    id: item.id.toString(),
    employeeId: item.employee.id.toString(),
    employeeName: `${item.employee.firstName} ${item.employee.lastName}`,
    leaveType: mapLeaveType(item.leaveType.leaveType),
    startDate: item.startDate,
    endDate: item.endDate,
    days: item.leaveDuration,
    reason: item.reason,
    status: item.status.toLowerCase() as any,
    toRecipients: [item.toEmail.email],
    ccRecipients: item.ccEmails.map(cc => cc.email),
    approvalSteps: approvalSteps,
    currentStep: 1,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    permissions: {
      canApprove: true,
      canReject: true,
      canCancel: false,
    },
  };
};

export const Approvals: React.FC = () => {
  const { currentUser } = useAuth();
  const { hasRolePrivilege } = useRolePrivilege();
  const { leaveRequests, addLeaveRequest, updateLeaveRequest } = useLeaveRequests();
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Read More logic
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<{ employeeName: string; reason: string } | null>(null);
  const [fullReasons, setFullReasons] = useState<Map<string, string>>(new Map());

  // Fetch pending approvals from backend
  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const data = await getPendingApprovals();
      const transformedData = data.map(transformLeaveRequest);
      setPendingRequests(transformedData);

      // Store full reasons
      const reasonsMap = new Map<string, string>();
      transformedData.forEach(req => {
        const trimmedReason = req.reason.trim();
        if (trimmedReason.length > 35) {
          reasonsMap.set(req.id, req.reason);
        }
      });
      setFullReasons(reasonsMap);
    } catch (error: any) {
      console.error('Error fetching pending approvals:', error);
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  // Sync pending requests to context so detail page can find them
  useEffect(() => {
    if (pendingRequests.length > 0) {
      pendingRequests.forEach(request => {
        // Check if request already exists in context to avoid overwriting newer data if any
        // But here we want to ensure these requests are available.
        const existingRequest = leaveRequests.find(r => r.id === request.id);
        if (!existingRequest) {
          addLeaveRequest(request);
        } else {
          // Optional: update if needed, but usually context is truth. 
          // However, for approvals, this might be the first time we see these requests 
          // if we haven't visited "My Leaves" or if they are from other users.
          // Let's update to be safe, assuming fetchPendingApprovals is fresh.
          updateLeaveRequest(request.id, request);
        }
      });
    }
  }, [pendingRequests, leaveRequests, addLeaveRequest, updateLeaveRequest]);

  const handleApprove = async (id: string) => {
    try {
      await approveLeaveRequest(Number(id));
      toast.success('Leave request approved successfully!');
      // Refresh the list
      await fetchPendingApprovals();
    } catch (error: any) {
      console.error('Error approving leave request:', error);

      // Extract error message from response
      let errorMessage = 'Failed to approve leave request';

      if (error.response?.data) {
        const responseData = error.response.data;

        // Check for statusMessage in the response
        if (responseData.statusMessage) {
          errorMessage = responseData.statusMessage;
        }
        // Check for message field
        else if (responseData.message) {
          errorMessage = responseData.message;
        }
        // Check if it's a bad request with insufficient leave days
        else if (error.response?.status === 400) {
          errorMessage = 'Cannot approve: Employee has insufficient leave balance for this leave type';
        }
      }

      toast.error(errorMessage, {
        duration: 5000,
        description: 'Please check the employee\'s leave balance before approving.',
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectLeaveRequest(Number(id));
      toast.error('Leave request rejected');
      // Refresh the list
      await fetchPendingApprovals();
    } catch (error: any) {
      console.error('Error rejecting leave request:', error);

      // Extract error message from response
      let errorMessage = 'Failed to reject leave request';

      if (error.response?.data) {
        const responseData = error.response.data;

        // Check for statusMessage in the response
        if (responseData.statusMessage) {
          errorMessage = responseData.statusMessage;
        }
        // Check for message field
        else if (responseData.message) {
          errorMessage = responseData.message;
        }
      }

      toast.error(errorMessage);
    }
  };

  const shouldShowReadMore = (requestId: string): boolean => {
    return fullReasons.has(requestId);
  };

  const handleReadMore = (requestId: string, employeeName: string) => {
    const fullReason = fullReasons.get(requestId) || '';
    setSelectedReason({ employeeName, reason: fullReason });
    setReasonDialogOpen(true);
  };

  const getFilteredRequests = () => {
    // For now, we only have pending requests from the backend
    // Backend doesn't maintain approved/rejected history per approver yet
    switch (activeTab) {
      case 'pending':
        return pendingRequests;
      case 'approved':
        return []; // TODO: Backend needs to provide this data
      case 'rejected':
        return []; // TODO: Backend needs to provide this data
      default:
        return pendingRequests;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Approvals" subtitle="Manage leave request approvals">
        <div className="flex items-center justify-center py-12">
          <Clock className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Approvals" subtitle="Manage leave request approvals">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Pending"
            value={pendingRequests.length}
            subtitle="Needs your action"
            icon={Clock}
          />
          <StatCard
            title="Approved"
            value={0}
            subtitle="By you"
            icon={CheckCircle}
          />
          <StatCard
            title="Rejected"
            value={0}
            subtitle="By you"
            icon={XCircle}
          />
          <StatCard
            title="Total"
            value={pendingRequests.length}
            subtitle="All requests"
            icon={AlertCircle}
          />
        </div>

        {/* Requests */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved (0)</TabsTrigger>
            <TabsTrigger value="rejected">Rejected (0)</TabsTrigger>
            <TabsTrigger value="all">All ({pendingRequests.length})</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {getFilteredRequests().map(request => (
                <div key={request.id} className="relative">
                  <LeaveRequestCard
                    request={{
                      ...request,
                      reason: shouldShowReadMore(request.id)
                        ? request.reason.trim().substring(0, 30)
                        : request.reason
                    }}
                    showActions={activeTab === 'pending' && hasRolePrivilege('APPROVE_LEAVES', 'canUpdate')}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                  {shouldShowReadMore(request.id) && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReadMore(request.id, request.employeeName);
                      }}
                      className="absolute text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium cursor-pointer z-10"
                      style={{ top: '48px', left: '390px' }}
                    >
                      Read More
                    </span>
                  )}
                </div>
              ))}
              {getFilteredRequests().length === 0 && (
                <div className="col-span-2 text-center py-12 bg-card border border-border rounded-xl">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No {activeTab} requests</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Read More Reason Dialog */}
      <Dialog open={reasonDialogOpen} onOpenChange={setReasonDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Leave Request Reason</DialogTitle>
          </DialogHeader>
          {selectedReason && (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Employee</p>
                <p className="text-foreground">{selectedReason.employeeName}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Reason</p>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{selectedReason.reason}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout >
  );
};
