import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { ComposeLeaveForm } from '@/components/organisms/ComposeLeaveForm/ComposeLeaveForm';
import { getMyLeaveBalance } from '@/components/services/leaveAllocationService';
import { LeaveBalanceItem } from '@/types';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LeaveTypeBadge } from '@/components/atoms/Badge/LeaveTypeBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const ApplyLeave: React.FC = () => {
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaveBalances();
  }, []);

  const fetchLeaveBalances = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyLeaveBalance();
      setLeaveBalances(response.leaveBalances || []);
    } catch (err: any) {
      console.error('Error fetching leave balances:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load leave balances');
      setLeaveBalances([]);
    } finally {
      setLoading(false);
    }
  };

  const mapLeaveTypeToColor = (leaveType: string): 'annual' | 'casual' | 'sick' | 'maternity' | 'paternity' | 'unpaid' => {
    const type = leaveType.toLowerCase();
    if (type.includes('annual')) return 'annual';
    if (type.includes('casual')) return 'casual';
    if (type.includes('sick')) return 'sick';
    if (type.includes('maternity')) return 'maternity';
    if (type.includes('paternity')) return 'paternity';
    return 'unpaid';
  };

  return (
    <DashboardLayout title="Apply for Leave" subtitle="Submit a new leave request" showApplyButton={false}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ComposeLeaveForm />
        </div>
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Your Leave Balances</h3>
          
          {loading && (
            <>
              <Skeleton className="h-[140px] w-full rounded-xl" />
              <Skeleton className="h-[140px] w-full rounded-xl" />
              <Skeleton className="h-[140px] w-full rounded-xl" />
            </>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && Array.isArray(leaveBalances) && leaveBalances.length === 0 && (
            <Alert>
              <AlertDescription>No leave balances found</AlertDescription>
            </Alert>
          )}

          {!loading && !error && Array.isArray(leaveBalances) && leaveBalances.map((balance) => {
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
                  
                  <div className="flex gap-4 text-xs">
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
    </DashboardLayout>
  );
};
