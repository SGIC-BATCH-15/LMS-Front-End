import React, { useState } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { LeaveRequestCard } from '@/components/organisms/LeaveRequestCard/LeaveRequestCard';
import { StatCard } from '@/components/molecules/StatCard/StatCard';
import { leaveRequests } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const Approvals: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');

  // Get requests that need current user's approval or have been processed by them
  const relevantRequests = leaveRequests.filter(r => 
    r.approvalSteps.some(step => step.approverId === currentUser.id)
  );

  const pendingRequests = relevantRequests.filter(r => 
    r.status === 'pending' && 
    r.approvalSteps.some(step => step.approverId === currentUser.id && step.status === 'pending' && step.order === r.currentStep)
  );

  const approvedRequests = relevantRequests.filter(r => 
    r.approvalSteps.some(step => step.approverId === currentUser.id && step.status === 'approved')
  );

  const rejectedRequests = relevantRequests.filter(r => 
    r.approvalSteps.some(step => step.approverId === currentUser.id && step.status === 'rejected')
  );

  const handleApprove = (id: string) => {
    toast.success('Leave request approved!');
  };

  const handleReject = (id: string) => {
    toast.error('Leave request rejected');
  };

  const getFilteredRequests = () => {
    switch (activeTab) {
      case 'pending':
        return pendingRequests;
      case 'approved':
        return approvedRequests;
      case 'rejected':
        return rejectedRequests;
      default:
        return relevantRequests;
    }
  };

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
            value={approvedRequests.length}
            subtitle="By you"
            icon={CheckCircle}
          />
          <StatCard
            title="Rejected"
            value={rejectedRequests.length}
            subtitle="By you"
            icon={XCircle}
          />
          <StatCard
            title="Total"
            value={relevantRequests.length}
            subtitle="All requests"
            icon={AlertCircle}
          />
        </div>

        {/* Requests */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedRequests.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedRequests.length})</TabsTrigger>
            <TabsTrigger value="all">All ({relevantRequests.length})</TabsTrigger>
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
