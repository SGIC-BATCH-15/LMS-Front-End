import React from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { LeaveBalanceCard } from '@/components/molecules/LeaveBalanceCard/LeaveBalanceCard';
import { StatCard } from '@/components/molecules/StatCard/StatCard';
import { LeaveRequestCard } from '@/components/organisms/LeaveRequestCard/LeaveRequestCard';
import { CalendarDays, CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';

import {
  getPendingRequestsCount,
  getTotalLeaveTaken,
  getRejectedRequestsCount,
  getMyLeaveBalance,
  getPendingApprovals as fetchPendingApprovals,
  LeaveTypeBalance,
  LeaveRequestResponse
} from '@/components/services/dashboardService';
import { getAllLeaveRequests, LeaveRequestItem } from '@/components/services/leaveRequestService';
import { LeaveType } from '@/types';

// Helper to map backend leave type strings to frontend keys
const normalizeLeaveType = (type: string): LeaveType => {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('casual')) return 'casual';
  if (lowerType.includes('sick')) return 'sick';
  if (lowerType.includes('maternity')) return 'maternity';
  if (lowerType.includes('paternity')) return 'paternity';
  if (lowerType.includes('unpaid')) return 'unpaid';
  return 'annual'; // Default fallback to prevent crash
};

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();

  const navigate = useNavigate();

  const [stats, setStats] = React.useState({
    leavesTaken: 0,
    pendingRequests: 0,
    rejectedRequests: 0,
  });

  const [leaveBalances, setLeaveBalances] = React.useState<LeaveTypeBalance[]>([]);
  const [userRequests, setUserRequests] = React.useState<LeaveRequestItem[]>([]);
  const [pendingApprovals, setPendingApprovals] = React.useState<LeaveRequestResponse[]>([]);
  const [loadingRequests, setLoadingRequests] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Stats
        const [pending, totalTaken, rejected] = await Promise.all([
          getPendingRequestsCount('PENDING'),
          getTotalLeaveTaken(),
          getRejectedRequestsCount(),
        ]);

        setStats({
          pendingRequests: pending || 0,
          leavesTaken: totalTaken || 0,
          rejectedRequests: rejected || 0,
        });

        // Fetch Leave Balances
        const balanceResponse = await getMyLeaveBalance();
        setLeaveBalances(balanceResponse.leaveBalances);

        // Fetch Recent Leave Requests
        try {
          setLoadingRequests(true);
          const allRequests = await getAllLeaveRequests();
          console.log('Fetched leave requests:', allRequests);
          console.log('Current user ID:', currentUser.id);
          
          // Sort by creation date (most recent first) and get all recent requests
          const recentRequests = allRequests
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          console.log('Recent requests:', recentRequests);
          setUserRequests(recentRequests);
        } catch (error) {
          console.error('Failed to fetch leave requests:', error);
          setUserRequests([]);
        } finally {
          setLoadingRequests(false);
        }

        // Fetch Pending Approvals (For Managers/Admins)
        if (currentUser.role === 'manager' || currentUser.role === 'admin') {
          const approvals = await fetchPendingApprovals();
          setPendingApprovals(approvals);
        }

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        setLoadingRequests(false);
      }
    };
    fetchData();
  }, [currentUser.id, currentUser.role]);






  const isStaff = currentUser.role === 'staff';
  const gridCols = isStaff ? 'lg:grid-cols-4' : 'lg:grid-cols-3';

  return (
    <DashboardLayout title="Dashboard" subtitle={`Welcome back, ${currentUser.name.split(' ')[0]}!`}>
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-4`}>
          <StatCard
            title="Leaves Taken"
            value={stats.leavesTaken}
            subtitle="Total Approved"
            icon={CalendarDays}
          />
          <StatCard
            title="Pending Requests"
            value={stats.pendingRequests}
            subtitle="Total Pending"
            icon={Clock}
          />
          {(currentUser.role === 'manager' || currentUser.role === 'admin') && (
            <>
              <StatCard
                title="Rejected Requests"
                value={stats.rejectedRequests}
                subtitle="Total Rejected"
                icon={AlertCircle}
              />
            </>
          )}
          {currentUser.role === 'staff' && (
            <>
              <StatCard
                title="Approved"
                value={userRequests.filter(r => r.status.toUpperCase() === 'APPROVED').length}
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
              {leaveBalances.map((balance) => (
                <LeaveBalanceCard
                  key={balance.leaveTypeId}
                  balance={{
                    id: balance.leaveTypeId,
                    leaveType: normalizeLeaveType(balance.leaveTypeName),
                    total: balance.allocatedDays + balance.carriedForwardDays,
                    used: balance.usedDays,
                    pending: 0, // Backend doesn't return pending count per type yet
                  } as any}
                />
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
                    .filter(r => r.status.toUpperCase() === 'APPROVED')
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
                    .filter(r => r.status.toUpperCase() === 'PENDING')
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
                    backgroundColor: '#22c55e', // Green for approved
                    color: 'white',
                    borderRadius: '50%'
                  },
                  pending: {
                    backgroundColor: '#f59e0b', // Amber/Orange for pending
                    color: 'white',
                    borderRadius: '50%'
                  }
                }}
                className="rounded-md border shadow-sm w-fit"
              />
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
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
                  request={{
                    id: request.id.toString(),
                    employeeId: request.employee.id,
                    employeeName: `${request.employee.firstName} ${request.employee.lastName}`,
                    leaveType: normalizeLeaveType(request.leaveType.leaveType),
                    status: request.status.toLowerCase(),
                    startDate: request.startDate,
                    endDate: request.endDate,
                    days: request.leaveDuration,
                    reason: request.reason,
                    approvalSteps: [] // Prevent crash
                  } as any}
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
            <h2 className="text-lg font-semibold text-foreground">Recent Leave Requests</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/my-leaves')}>
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loadingRequests ? (
              <div className="col-span-2 text-center py-12 bg-card border border-border rounded-xl">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4 animate-spin" />
                <p className="text-muted-foreground">Loading leave requests...</p>
              </div>
            ) : userRequests.length > 0 ? (
              userRequests.slice(0, 4).map(request => (
                <LeaveRequestCard
                  key={request.id}
                  request={{
                    id: request.id.toString(),
                    employeeId: request.employee.id,
                    employeeName: `${request.employee.firstName} ${request.employee.lastName}`,
                    leaveType: normalizeLeaveType(request.leaveType.leaveType),
                    status: request.status.toLowerCase(),
                    startDate: request.startDate,
                    endDate: request.endDate,
                    days: request.leaveDuration,
                    reason: request.reason,
                    approvalSteps: [] // Prevent crash
                  } as any}
                />
              ))
            ) : (
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