import React, { useState } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { LeaveBalanceCard } from '@/components/molecules/LeaveBalanceCard/LeaveBalanceCard';
import { LeaveRequestCard } from '@/components/organisms/LeaveRequestCard/LeaveRequestCard';
import { leaveBalances, leaveRequests } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const MyLeaves: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  const userBalances = leaveBalances.filter(b => b.userId === currentUser.id);
  const userRequests = leaveRequests.filter(r => r.employeeId === currentUser.id);

  const filteredRequests = activeTab === 'all'
    ? userRequests
    : userRequests.filter(r => r.status === activeTab);

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
                  <LeaveRequestCard key={request.id} request={request} />
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
    </DashboardLayout>
  );
};
