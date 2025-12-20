import React from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { LeaveBalanceCard } from '@/components/molecules/LeaveBalanceCard/LeaveBalanceCard';
import { StatCard } from '@/components/molecules/StatCard/StatCard';
import { LeaveRequestCard } from '@/components/organisms/LeaveRequestCard/LeaveRequestCard';
import { leaveBalances, leaveRequests } from '@/data/mockData';
import { CalendarDays, CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const userBalances = leaveBalances.filter(b => b.userId === currentUser.id);
  const userRequests = leaveRequests.filter(r => r.employeeId === currentUser.id);

  // For managers/admins - get pending approvals
  const pendingApprovals = leaveRequests.filter(r => {
    if (currentUser.role === 'staff') return false;
    return r.status === 'pending' && r.approvalSteps.some(
      step => step.approverId === currentUser.id && step.status === 'pending'
    );
  });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const leavesTakenThisMonth = userRequests
    .filter(r => {
      const leaveDate = new Date(r.startDate);
      return r.status === 'approved' &&
        leaveDate.getMonth() === currentMonth &&
        leaveDate.getFullYear() === currentYear;
    })
    .reduce((acc, r) => acc + r.days, 0);

  const pendingRequests = userRequests.filter(r => r.status === 'pending').length;

  const isStaff = currentUser.role === 'staff';
  const gridCols = isStaff ? 'lg:grid-cols-4' : 'lg:grid-cols-3';

  return (
    <DashboardLayout title="Dashboard" subtitle={`Welcome back, ${currentUser.name.split(' ')[0]}!`}>
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-4`}>
          <StatCard
            title="Leaves Taken"
            value={leavesTakenThisMonth}
            subtitle="This month"
            icon={CalendarDays}
          />
          <StatCard
            title="Pending Requests"
            value={pendingRequests}
            subtitle="Awaiting approval"
            icon={Clock}
          />
          {(currentUser.role === 'manager' || currentUser.role === 'admin') && (
            <>
              <StatCard
                title="Pending Approvals"
                value={pendingApprovals.length}
                subtitle="Needs your action"
                icon={AlertCircle}
              />
            </>
          )}
          {currentUser.role === 'staff' && (
            <>
              <StatCard
                title="Approved"
                value={userRequests.filter(r => r.status === 'approved').length}
                subtitle="This year"
                icon={CheckCircle}
              />
              <StatCard
                title="Experience"
                value={`${currentUser.currentExperience + currentUser.previousExperience}y`}
                subtitle="Total work experience"
                icon={TrendingUp}
              />
            </>
          )}
        </div>

        {/* Leave Balances */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Leave Balances</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/my-leaves')}>
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userBalances.map(balance => (
              <LeaveBalanceCard key={balance.id} balance={balance} />
            ))}
          </div>
        </div>

        {/* Pending Approvals for Managers */}
        {pendingApprovals.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Pending Approvals</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/approvals')}>
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingApprovals.slice(0, 4).map(request => (
                <LeaveRequestCard
                  key={request.id}
                  request={request}
                  showActions
                  onApprove={(id) => console.log('Approve:', id)}
                  onReject={(id) => console.log('Reject:', id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Requests */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Requests</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/my-leaves')}>
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {userRequests.slice(0, 4).map(request => (
              <LeaveRequestCard key={request.id} request={request} />
            ))}
            {userRequests.length === 0 && (
              <div className="col-span-2 text-center py-12 bg-card border border-border rounded-xl">
                <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No leave requests yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
