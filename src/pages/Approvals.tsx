import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { LeaveRequestCard } from '@/components/organisms/LeaveRequestCard/LeaveRequestCard';
import { StatCard } from '@/components/molecules/StatCard/StatCard';
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
    approvalSteps: [], // Backend doesn't return approval steps in pending approvals
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
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch pending approvals from backend
  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const data = await getPendingApprovals();
      const transformedData = data.map(transformLeaveRequest);
      setPendingRequests(transformedData);
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
                <LeaveRequestCard
                  key={request.id}
                  request={request}
                  showActions={activeTab === 'pending'}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
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
    </DashboardLayout>
  );
};
