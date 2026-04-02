import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useLeaveRequests } from '@/context/LeaveRequestContext';
import { EditLeaveForm } from '@/components/services/leaveRequestService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LeaveRequest } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getAllLeaveRequests, deleteLeaveRequest, LeaveRequestItem } from '@/components/services/leaveRequestService';
import { getMyLeaveBalance, LeaveBalanceItem } from '@/components/services/leaveAllocationService';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LeaveTypeBadge } from '@/components/atoms/Badge/LeaveTypeBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { LeaveRequestCard } from '@/components/organisms/LeaveRequestCard/LeaveRequestCard';
import { useRolePrivilege } from '@/context/RolePrivilegeContext';

export const MyLeaves: React.FC = () => {
  const { currentUser } = useAuth();
  const { hasRolePrivilege } = useRolePrivilege();
  const { leaveRequests, updateLeaveRequest, addLeaveRequest } = useLeaveRequests();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null);

  // Backend data state
  const [backendLeaveRequests, setBackendLeaveRequests] = useState<LeaveRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Leave balances state
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceItem[]>([]);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [balancesError, setBalancesError] = useState<string | null>(null);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | undefined>(undefined);
  const [editingBackendRequest, setEditingBackendRequest] = useState<LeaveRequestItem | undefined>(undefined);

  // Read More reason dialog state
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<{ employeeName: string; reason: string } | null>(null);

  // Store full reasons for requests with truncated display
  const [fullReasons, setFullReasons] = useState<Map<string, string>>(new Map());

  // Fetch leave balances from backend
  useEffect(() => {
    const fetchLeaveBalances = async () => {
      try {
        setBalancesLoading(true);
        setBalancesError(null);
        const response = await getMyLeaveBalance();
        setLeaveBalances(response.leaveBalances || []);
      } catch (err: any) {
        console.error('Error fetching leave balances:', err);
        setBalancesError(err.response?.data?.message || err.message || 'Failed to load leave balances');
        setLeaveBalances([]);
      } finally {
        setBalancesLoading(false);
      }
    };

    fetchLeaveBalances();
  }, []);

  const mapLeaveTypeToColor = (leaveType: string): 'annual' | 'casual' | 'sick' | 'maternity' | 'paternity' | 'unpaid' => {
    const type = leaveType.toLowerCase();
    if (type.includes('annual')) return 'annual';
    if (type.includes('casual')) return 'casual';
    if (type.includes('sick')) return 'sick';
    if (type.includes('maternity')) return 'maternity';
    if (type.includes('paternity')) return 'paternity';
    return 'unpaid';
  };

  // Check if reason should show Read More
  const shouldShowReadMore = (requestId: string): boolean => {
    return fullReasons.has(requestId);
  };

  // Handle Read More click
  const handleReadMore = (requestId: string, employeeName: string) => {
    const fullReason = fullReasons.get(requestId) || '';
    setSelectedReason({ employeeName, reason: fullReason });
    setReasonDialogOpen(true);
  };

  // Fetch leave requests from backend
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        setLoading(true);
        const requests = await getAllLeaveRequests();
        console.log('Fetched leave requests:', requests);
        setBackendLeaveRequests(requests);

        // Process reasons to identify which ones need "Read More"
        // Show "Read More" if reason exceeds 35 characters
        const reasonsMap = new Map<string, string>();
        requests.forEach(req => {
          const trimmedReason = req.reason.trim();
          if (trimmedReason.length > 35) {
            reasonsMap.set(req.id.toString(), req.reason);
          }
        });
        setFullReasons(reasonsMap);
      } catch (error) {
        console.error('Error fetching leave requests:', error);
        toast.error('Failed to load leave requests');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveRequests();
  }, []);

  // Convert backend data to frontend format WITH FULL REASON (for context/detail page)
  const convertedRequestsWithFullReason: LeaveRequest[] = backendLeaveRequests.map(req => {
    // Build approval steps from backend data
    const approvalSteps = [];

    // Determine status for TO recipient
    let toStatus: 'pending' | 'approved' | 'rejected' = 'pending';
    if (req.status.toLowerCase() === 'approved') {
      if (req.approvedBy) {
        toStatus = req.approvedBy.id === req.toEmail.id ? 'approved' : 'pending';
      } else {
        toStatus = 'approved'; // Fallback
      }
    } else if (req.status.toLowerCase() === 'rejected') {
      if (req.rejectedBy) {
        toStatus = req.rejectedBy.id === req.toEmail.id ? 'rejected' : 'pending';
      } else {
        toStatus = 'rejected'; // Fallback
      }
    }

    // Add TO recipient as primary approver
    const toStep = {
      id: `step-${req.id}-to`,
      approverId: req.toEmail.id.toString(),
      approverName: `${req.toEmail.firstName} ${req.toEmail.lastName}`,
      approverRole: 'Primary Approver',
      status: toStatus,
      actionDate: toStatus === 'approved' ? req.approvedAt :
        toStatus === 'rejected' ? req.rejectedAt : undefined,
      comment: req.comments,
      order: 1,
    };
    approvalSteps.push(toStep);

    // Add CC recipients as secondary approvers/reviewers
    req.ccEmails.forEach((cc, index) => {
      let ccStatus: 'pending' | 'approved' | 'rejected' = 'pending';
      if (req.status.toLowerCase() === 'approved' && req.approvedBy?.id === cc.id) {
        ccStatus = 'approved';
      } else if (req.status.toLowerCase() === 'rejected' && req.rejectedBy?.id === cc.id) {
        ccStatus = 'rejected';
      }

      const ccStep = {
        id: `step-${req.id}-cc-${cc.id}`,
        approverId: cc.id.toString(),
        approverName: `${cc.firstName} ${cc.lastName}`,
        approverRole: 'Reviewer (CC)',
        status: ccStatus,
        actionDate: ccStatus === 'approved' ? req.approvedAt :
          ccStatus === 'rejected' ? req.rejectedAt : undefined,
        comment: req.comments,
        order: index + 2,
      };
      approvalSteps.push(ccStep);
    });

    return {
      id: req.id.toString(),
      employeeId: req.employee.id.toString(),
      employeeName: `${req.employee.firstName} ${req.employee.lastName}`,
      leaveType: req.leaveType.leaveType.toLowerCase().includes('annual') ? 'annual' :
        req.leaveType.leaveType.toLowerCase().includes('sick') ? 'sick' :
          req.leaveType.leaveType.toLowerCase().includes('casual') ? 'casual' :
            req.leaveType.leaveType.toLowerCase().includes('maternity') ? 'maternity' :
              req.leaveType.leaveType.toLowerCase().includes('paternity') ? 'paternity' : 'unpaid',
      startDate: req.startDate,
      endDate: req.endDate,
      days: req.halfDay ? 0.5 : req.leaveDuration,
      reason: req.reason, // Full reason for detail page
      status: req.status.toLowerCase() as 'pending' | 'approved' | 'rejected' | 'cancelled',
      toRecipients: [req.toEmail.id.toString()],
      ccRecipients: req.ccEmails.map(cc => cc.id.toString()),
      approvalSteps: approvalSteps,
      currentStep: 1,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
      permissions: {
        canApprove: false,
        canReject: false,
        canCancel: req.status.toLowerCase() === 'pending',
      },
    };
  });

  // Sync converted requests (with full reason) to context so detail page can find them
  useEffect(() => {
    if (convertedRequestsWithFullReason.length > 0) {
      // Sync backend leave requests to context
      convertedRequestsWithFullReason.forEach(request => {
        // Check if request already exists in context
        const existingRequest = leaveRequests.find(r => r.id === request.id);
        if (!existingRequest) {
          // Add new request to context
          addLeaveRequest(request);
        } else {
          // Update existing request in context
          updateLeaveRequest(request.id, request);
        }
      });
    }
  }, [backendLeaveRequests, leaveRequests, addLeaveRequest, updateLeaveRequest]);

  // Convert backend data to frontend format WITH TRUNCATED REASON (for display)
  const convertedRequests: LeaveRequest[] = backendLeaveRequests.map(req => {
    // Build approval steps from backend data
    const approvalSteps = [];

    // Determine status for TO recipient
    let toStatus: 'pending' | 'approved' | 'rejected' = 'pending';
    if (req.status.toLowerCase() === 'approved') {
      if (req.approvedBy) {
        toStatus = req.approvedBy.id === req.toEmail.id ? 'approved' : 'pending';
      } else {
        toStatus = 'approved'; // Fallback
      }
    } else if (req.status.toLowerCase() === 'rejected') {
      if (req.rejectedBy) {
        toStatus = req.rejectedBy.id === req.toEmail.id ? 'rejected' : 'pending';
      } else {
        toStatus = 'rejected'; // Fallback
      }
    }

    // Add TO recipient as primary approver
    const toStep = {
      id: `step-${req.id}-to`,
      approverId: req.toEmail.id.toString(),
      approverName: `${req.toEmail.firstName} ${req.toEmail.lastName}`,
      approverRole: 'Primary Approver',
      status: toStatus,
      actionDate: toStatus === 'approved' ? req.approvedAt :
        toStatus === 'rejected' ? req.rejectedAt : undefined,
      comment: req.comments,
      order: 1,
    };
    approvalSteps.push(toStep);

    // Add CC recipients as secondary approvers/reviewers
    req.ccEmails.forEach((cc, index) => {
      let ccStatus: 'pending' | 'approved' | 'rejected' = 'pending';
      if (req.status.toLowerCase() === 'approved' && req.approvedBy?.id === cc.id) {
        ccStatus = 'approved';
      } else if (req.status.toLowerCase() === 'rejected' && req.rejectedBy?.id === cc.id) {
        ccStatus = 'rejected';
      }

      const ccStep = {
        id: `step-${req.id}-cc-${cc.id}`,
        approverId: cc.id.toString(),
        approverName: `${cc.firstName} ${cc.lastName}`,
        approverRole: 'Reviewer (CC)',
        status: ccStatus,
        actionDate: ccStatus === 'approved' ? req.approvedAt :
          ccStatus === 'rejected' ? req.rejectedAt : undefined,
        comment: req.comments,
        order: index + 2,
      };
      approvalSteps.push(ccStep);
    });

    return {
      id: req.id.toString(),
      employeeId: req.employee.id.toString(),
      employeeName: `${req.employee.firstName} ${req.employee.lastName}`,
      leaveType: req.leaveType.leaveType.toLowerCase().includes('annual') ? 'annual' :
        req.leaveType.leaveType.toLowerCase().includes('sick') ? 'sick' :
          req.leaveType.leaveType.toLowerCase().includes('casual') ? 'casual' :
            req.leaveType.leaveType.toLowerCase().includes('maternity') ? 'maternity' :
              req.leaveType.leaveType.toLowerCase().includes('paternity') ? 'paternity' : 'unpaid',
      startDate: req.startDate,
      endDate: req.endDate,
      days: req.halfDay ? 0.5 : req.leaveDuration,
      reason: (() => {
        const trimmedReason = req.reason.trim();

        // Truncate if more than 35 characters - show first 30 chars
        // Don't add '...' here as we'll add it inline with Read More
        if (trimmedReason.length > 35) {
          return trimmedReason.substring(0, 30);
        }

        return req.reason;
      })(),
      status: req.status.toLowerCase() as 'pending' | 'approved' | 'rejected' | 'cancelled',
      toRecipients: [req.toEmail.id.toString()],
      ccRecipients: req.ccEmails.map(cc => cc.id.toString()),
      approvalSteps: approvalSteps,
      currentStep: 1,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
      permissions: {
        canApprove: false,
        canReject: false,
        canCancel: req.status.toLowerCase() === 'pending',
      },
    };
  });

  console.log('Current User ID:', currentUser?.id);
  console.log('Current User Email:', currentUser?.email);
  console.log('Converted Requests:', convertedRequests.map(r => ({
    id: r.id,
    employeeId: r.employeeId,
    employeeName: r.employeeName,
    status: r.status
  })));


  const filteredRequests = activeTab === 'all'
    ? convertedRequests
    : convertedRequests.filter(r => r.status === activeTab);

  const handleEdit = (requestId: string) => {
    const request = convertedRequestsWithFullReason.find(r => r.id === requestId);
    const backendRequest = backendLeaveRequests.find(r => r.id.toString() === requestId);
    if (request && backendRequest) {
      setEditingRequest(request);
      setEditingBackendRequest(backendRequest);
      setEditDialogOpen(true);
    }
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingRequest(undefined);
    setEditingBackendRequest(undefined);
    // Refresh leave requests after edit
    const fetchLeaveRequests = async () => {
      try {
        const requests = await getAllLeaveRequests();
        console.log('Refreshed leave requests after edit:', requests);
        setBackendLeaveRequests(requests);
      } catch (error) {
        console.error('Error refreshing leave requests:', error);
      }
    };
    fetchLeaveRequests();
  };

  const handleCancelRequest = (requestId: string) => {
    setRequestToCancel(requestId);
    setCancelDialogOpen(true);
  };

  const confirmCancel = async () => {
    if (requestToCancel) {
      try {
        // Call backend API to delete the leave request
        await deleteLeaveRequest(Number(requestToCancel));

        // Remove from local state
        setBackendLeaveRequests(prev =>
          prev.filter(req => req.id.toString() !== requestToCancel)
        );

        toast.success('Leave request deleted successfully');
        setCancelDialogOpen(false);
        setRequestToCancel(null);
      } catch (error) {
        console.error('Error deleting leave request:', error);
        toast.error('Failed to delete leave request');
      }
    }
  };

  return (
    <DashboardLayout title="My Leaves" subtitle="Manage your leave requests">
      <div className="space-y-6">
        {/* Leave Balances */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Leave Balances</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {balancesLoading && (
              <>
                <Skeleton className="h-[140px] w-full rounded-xl" />
                <Skeleton className="h-[140px] w-full rounded-xl" />
                <Skeleton className="h-[140px] w-full rounded-xl" />
              </>
            )}

            {balancesError && (
              <div className="col-span-3">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{balancesError}</AlertDescription>
                </Alert>
              </div>
            )}

            {!balancesLoading && !balancesError && Array.isArray(leaveBalances) && leaveBalances.length === 0 && (
              <div className="col-span-3">
                <Alert>
                  <AlertDescription>No leave balances found</AlertDescription>
                </Alert>
              </div>
            )}

            {!balancesLoading && !balancesError && Array.isArray(leaveBalances) && leaveBalances.map((balance) => {
              const totalDays = balance.allocatedDays + balance.carriedForwardDays;
              const usedPercentage = totalDays > 0
                ? (balance.usedDays / totalDays) * 100
                : 0;

              return (
                <Card key={balance.leaveTypeId} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <LeaveTypeBadge type={mapLeaveTypeToColor(balance.leaveTypeName)} />
                    <span className="text-2xl font-bold text-foreground">
                      {balance.remainingDays}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Progress value={usedPercentage} className="h-2" />

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Remaining: {balance.remainingDays}</span>
                      <span>Total: {totalDays}</span>
                    </div>

                    <div className="flex gap-4 text-xs flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        <span className="text-muted-foreground">Used: {balance.usedDays}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-muted-foreground">Allocated: {balance.allocatedDays}</span>
                      </div>
                      {balance.carriedForwardDays > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          <span className="text-muted-foreground">Carried: {balance.carriedForwardDays}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Leave Requests */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Leave Requests</h2>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({convertedRequests.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({convertedRequests.filter(r => r.status === 'pending').length})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({convertedRequests.filter(r => r.status === 'approved').length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({convertedRequests.filter(r => r.status === 'rejected').length})</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredRequests.map(request => (
                    <div key={request.id} className="relative">
                      <LeaveRequestCard
                        request={{
                          ...request,
                          reason: shouldShowReadMore(request.id)
                            ? request.reason + '... '
                            : request.reason
                        }}
                        onEdit={hasRolePrivilege('APPLY_LEAVE', 'canUpdate') ? handleEdit : undefined}
                        onCancel={hasRolePrivilege('APPLY_LEAVE', 'canDelete') ? handleCancelRequest : undefined}
                      />
                      {shouldShowReadMore(request.id) && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReadMore(request.id, request.employeeName);
                          }}
                          className="absolute text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium cursor-pointer z-10"
                          style={{ top: '48px', left: '300px' }}
                        >
                          Read More
                        </span>
                      )}
                    </div>
                  ))}
                  {filteredRequests.length === 0 && (
                    <div className="col-span-2 text-center py-12 bg-card border border-border rounded-xl">
                      <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No {activeTab === 'all' ? '' : activeTab} leave requests</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Leave Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this leave request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep It</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-destructive hover:bg-destructive/90">
              Yes, Delete Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Leave Request</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {editingRequest && (
              <EditLeaveForm
                initialData={editingRequest}
                originalBackendData={editingBackendRequest}
                onClose={handleEditClose}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

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
                <p className="text-foreground leading-relaxed">{selectedReason.reason}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};
