import React from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { ComposeLeaveForm } from '@/components/organisms/ComposeLeaveForm/ComposeLeaveForm';
import { LeaveBalanceCard } from '@/components/molecules/LeaveBalanceCard/LeaveBalanceCard';
import { useAuth } from '@/context/AuthContext';
import { leaveBalances } from '@/data/mockData';

export const ApplyLeave: React.FC = () => {
  const { currentUser } = useAuth();
  const userBalances = leaveBalances.filter(b => b.userId === currentUser.id);

  return (
    <DashboardLayout title="Apply for Leave" subtitle="Submit a new leave request" showApplyButton={false}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ComposeLeaveForm />
        </div>
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Your Leave Balances</h3>
          {userBalances.map(balance => (
            <LeaveBalanceCard key={balance.id} balance={balance} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};
