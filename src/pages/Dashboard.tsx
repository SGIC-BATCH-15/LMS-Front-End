import React from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useLeaveRequests } from '@/context/LeaveRequestContext';
import { LeaveBalanceCard } from '@/components/molecules/LeaveBalanceCard/LeaveBalanceCard';
import { StatCard } from '@/components/molecules/StatCard/StatCard';
import { LeaveRequestCard } from '@/components/organisms/LeaveRequestCard/LeaveRequestCard';
import { leaveBalances } from '@/data/mockData';
import { CalendarDays, CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { leaveRequests } = useLeaveRequests();
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

        {/* Leave Balances & Calendar Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Leave Balances */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Leave Balances</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/my-leaves')}>
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userBalances.map(balance => (
                <LeaveBalanceCard key={balance.id} balance={balance} />
              ))}
            </div>
          </div>

          {/* Right Column: Calendar */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm h-fit">
            <h3 className="font-semibold mb-4 text-center">My Leave Calendar</h3>
            <div className="flex justify-center">
              <Calendar
                mode="default"
                modifiers={{
                  approved: userRequests
                    .filter(r => r.status === 'approved')
                    .flatMap(r => {
                      const start = new Date(r.startDate);
                      const end = new Date(r.endDate);
                      const dates = [];
                      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                        dates.push(new Date(d));
                      }
                      return dates;
                    }),
                  pending: userRequests
                    .filter(r => r.status === 'pending')
                    .flatMap(r => {
                      const start = new Date(r.startDate);
                      const end = new Date(r.endDate);
                      const dates = [];
                      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                        dates.push(new Date(d));
                      }
                      return dates;
                    })
                }}
                modifiersStyles={{
                  approved: {
                    backgroundColor: '#ef4444', // Red for approved
                    color: 'white',
                    borderRadius: '50%'
                  },
                  pending: {
                    backgroundColor: '#22c55e', // Green for pending
                    color: 'white',
                    borderRadius: '50%'
                  }
                }}
                className="rounded-md border shadow-sm w-fit"
              />
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Pending</span>
              </div>
            </div>
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
