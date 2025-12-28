import React, { useState } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useLeaveRequests } from '@/context/LeaveRequestContext';
import { LeaveBalanceCard } from '@/components/molecules/LeaveBalanceCard/LeaveBalanceCard';
import { LeaveRequestCard } from '@/components/organisms/LeaveRequestCard/LeaveRequestCard';
import { ComposeLeaveForm } from '@/components/organisms/ComposeLeaveForm/ComposeLeaveForm';
import { leaveBalances } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays } from 'lucide-react';
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

export const MyLeaves: React.FC = () => {
  const { currentUser } = useAuth();
  const { leaveRequests, updateLeaveRequest } = useLeaveRequests();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | undefined>(undefined);

  const userBalances = leaveBalances.filter(b => b.userId === currentUser.id);
  const userRequests = leaveRequests.filter(r => r.employeeId === currentUser.id);

  const filteredRequests = activeTab === 'all'
    ? userRequests
    : userRequests.filter(r => r.status === activeTab);

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

  const confirmCancel = () => {
    if (requestToCancel) {
      updateLeaveRequest(requestToCancel, {
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      });
      toast.success('Leave request cancelled successfully');
      setCancelDialogOpen(false);
      setRequestToCancel(null);
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
              <TabsTrigger value="all">All ({userRequests.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({userRequests.filter(r => r.status === 'pending').length})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({userRequests.filter(r => r.status === 'approved').length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({userRequests.filter(r => r.status === 'rejected').length})</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredRequests.map(request => (
                  <LeaveRequestCard
                    key={request.id}
                    request={request}
                    onEdit={handleEdit}
                    onCancel={handleCancelRequest}
                  />
                ))}
                {filteredRequests.length === 0 && (
                  <div className="col-span-2 text-center py-12 bg-card border border-border rounded-xl">
                    <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No {activeTab === 'all' ? '' : activeTab} leave requests</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Leave Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this leave request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep It</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-destructive hover:bg-destructive/90">
              Yes, Cancel Request
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
    </DashboardLayout>
  );
};
