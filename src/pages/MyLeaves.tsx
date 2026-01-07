import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useLeaveRequests } from '@/context/LeaveRequestContext';
import { LeaveBalanceCard } from '@/components/molecules/LeaveBalanceCard/LeaveBalanceCard';
import { LeaveRequestCard } from '@/components/organisms/LeaveRequestCard/LeaveRequestCard';
import { ComposeLeaveForm } from '@/components/organisms/ComposeLeaveForm/ComposeLeaveForm';
import { leaveBalances } from '@/data/mockData';
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

export const MyLeaves: React.FC = () => {
  const { currentUser } = useAuth();
  const { leaveRequests, updateLeaveRequest, addLeaveRequest } = useLeaveRequests();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null);

  // Backend data state
  const [backendLeaveRequests, setBackendLeaveRequests] = useState<LeaveRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | undefined>(undefined);

  // Read More reason dialog state
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<{ employeeName: string; reason: string } | null>(null);

  // Store full reasons for requests with truncated display
  const [fullReasons, setFullReasons] = useState<Map<string, string>>(new Map());

  const userBalances = leaveBalances.filter(b => b.userId === currentUser.id);

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
  const convertedRequestsWithFullReason: LeaveRequest[] = backendLeaveRequests.map(req => ({
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
    approvalSteps: [{
      id: `step-${req.id}`,
      approverId: req.toEmail.id.toString(),
      approverName: `${req.toEmail.firstName} ${req.toEmail.lastName}`,
      approverRole: 'Approver',
      status: req.status.toLowerCase() === 'approved' ? 'approved' as const :
        req.status.toLowerCase() === 'rejected' ? 'rejected' as const : 'pending' as const,
      order: 1,
    }],
    currentStep: 1,
    createdAt: req.createdAt,
    updatedAt: req.updatedAt,
    permissions: {
      canApprove: false,
      canReject: false,
      canCancel: req.status.toLowerCase() === 'pending',
    },
  }));

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
  const convertedRequests: LeaveRequest[] = backendLeaveRequests.map(req => ({
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
    approvalSteps: [{
      id: `step-${req.id}`,
      approverId: req.toEmail.id.toString(),
      approverName: `${req.toEmail.firstName} ${req.toEmail.lastName}`,
      approverRole: 'Approver',
      status: req.status.toLowerCase() === 'approved' ? 'approved' as const :
        req.status.toLowerCase() === 'rejected' ? 'rejected' as const : 'pending' as const,
      order: 1,
    }],
    currentStep: 1,
    createdAt: req.createdAt,
    updatedAt: req.updatedAt,
    permissions: {
      canApprove: false,
      canReject: false,
      canCancel: req.status.toLowerCase() === 'pending',
    },
  }));

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
    const request = leaveRequests.find(r => r.id === requestId);
    if (request) {
      setEditingRequest(request);
      setEditDialogOpen(true);
    }
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingRequest(undefined);
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
            {userBalances.map(balance => (
              <LeaveBalanceCard key={balance.id} balance={balance} />
            ))}
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
                        onEdit={handleEdit}
                        onCancel={handleCancelRequest}
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
              <ComposeLeaveForm
                initialData={editingRequest}
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
