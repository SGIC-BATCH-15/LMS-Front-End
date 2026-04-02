import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, CalendarPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRolePrivilege } from '@/context/RolePrivilegeContext';
import { UserAvatar } from '@/components/atoms/Avatar/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { employeeService } from '@/components/services/employeeService';
import { leaveAllocationServices, LeaveBalanceResponseDto } from '@/components/leaveAllocationServices';

export const LeaveAllocation: React.FC = () => {
    const { hasPermission } = useAuth();
    const { hasRolePrivilege } = useRolePrivilege();
    const [allocations, setAllocations] = useState<LeaveBalanceResponseDto[]>([]);
    const [loading, setLoading] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isAllocating, setIsAllocating] = useState(false);
    const [isCarryingForward, setIsCarryingForward] = useState(false);
    const itemsPerPage = 5;

    const [employees, setEmployees] = useState<any[]>([]);

    // Fetch All Allocations and Employees on Mount
    useEffect(() => {
        fetchAllAllocations();
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const data = await employeeService.getAllEmployees();
            if (Array.isArray(data)) {
                setEmployees(data);
            }
        } catch (error) {
            console.error('Failed to fetch employees for validation:', error);
        }
    };

    const fetchAllAllocations = async () => {
        setLoading(true);
        try {
            const data = await leaveAllocationServices.getAllAllocations();
            console.log('Allocations fetched:', data);
            if (Array.isArray(data)) {
                setAllocations(data);
            } else {
                setAllocations([]);
            }
        } catch (error) {
            console.error('Failed to fetch allocations:', error);
            toast.error('Failed to load leave allocations');
            setAllocations([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter Allocations by Employee Name
    const filteredAllocations = allocations.filter((alloc) => {
        const employeeName = alloc.employeeName || '';
        return employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Flatten data into table rows FIRST
    const allTableRows = filteredAllocations.flatMap(alloc => {
        if (!alloc.leaveBalances || alloc.leaveBalances.length === 0) {
            return [];
        }

        return alloc.leaveBalances.map((lb) => ({
            id: `${alloc.employeeId}-${lb.leaveTypeId}`,
            employeeName: alloc.employeeName,
            leaveType: lb.leaveTypeName,
            allocated: lb.allocatedDays,
            carryForward: lb.carriedForwardDays,
            used: lb.usedDays,
            year: alloc.year
        }));
    });

    // Pagination Logic (Paginate by Rows)
    const totalPages = Math.ceil(allTableRows.length / itemsPerPage);

    // Ensure current page is valid after filtering/deletion/search
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(Math.max(1, totalPages || 1));
        }
    }, [totalPages, currentPage]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTableRows = allTableRows.slice(indexOfFirstItem, indexOfLastItem);

    const handleLeaveAllocation = async () => {
        setIsAllocating(true);
        try {
            // Allocate for current year by default
            const currentYear = new Date().getFullYear();
            await leaveAllocationServices.allocateLeaves(currentYear);

            toast.success('Allocation Successful', {
                description: `Successfully allocated leaves for year ${currentYear}.`,
                duration: 5000,
            });

            // Refresh allocations
            fetchAllAllocations();
        } catch (error: any) {
            toast.error('Allocation Failed', {
                description: error.message || 'Failed to allocate leaves.',
            });
        } finally {
            setIsAllocating(false);
        }
    };

    const handleCarryForwardAllocation = async () => {
        // Validation: Check if any employee has > 1 year of service
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const hasEligibleEmployee = employees.some(emp => {
            if (!emp.joinDate) return false;
            const joinDate = new Date(emp.joinDate);
            return joinDate <= oneYearAgo;
        });

        if (!hasEligibleEmployee) {
            toast.info('Carry Forward Not Applicable', {
                description: 'None of the employees have completed one year of service.',
            });
            return;
        }

        setIsCarryingForward(true);
        try {
            const currentYear = new Date().getFullYear();
            const fromYear = currentYear - 1;

            await leaveAllocationServices.processCarryForward({
                fromYear,
                toYear: currentYear
            });

            toast.success('Carry Forward Processed', {
                description: `Successfully processed carry forward from ${fromYear} to ${currentYear}.`,
                duration: 5000,
            });

            // Refresh allocations
            fetchAllAllocations();
        } catch (error: any) {
            toast.error('Carry Forward Failed', {
                description: error.message || 'Failed to process carry forward.',
            });
        } finally {
            setIsCarryingForward(false);
        }
    };

    return (
        <DashboardLayout
            title="Leave Allocation"
            subtitle="Manage employee leave allocations and carry forwards"
        >
            <div className="space-y-6">
                {/* Filters and Actions */}
                <div className="flex items-center justify-between">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex gap-2">
                        {/* Secondary Button: Carry Forward Allocation */}
                        {hasRolePrivilege('MANAGE_LEAVE_ALLOCATION', 'canWrite') && (
                            <Button
                                className="gap-2"
                                onClick={handleCarryForwardAllocation}
                                disabled={isCarryingForward}
                            >
                                <CalendarPlus className={isCarryingForward ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
                                {isCarryingForward ? 'Processing...' : 'Carry Forward Allocation'}
                            </Button>
                        )}

                        {/* Primary Button: Leave Allocation */}
                        {hasRolePrivilege('MANAGE_LEAVE_ALLOCATION', 'canWrite') && (
                            <Button
                                className="gap-2"
                                onClick={handleLeaveAllocation}
                                disabled={isAllocating}
                            >
                                <Plus className={isAllocating ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
                                {isAllocating ? 'Allocating...' : 'Leave Allocation'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee Name</TableHead>
                                <TableHead>Leave Type</TableHead>
                                <TableHead className="text-center">Allocated Days</TableHead>
                                <TableHead className="text-center">Carry Forward Days</TableHead>
                                <TableHead className="text-center">Used Days</TableHead>
                                <TableHead className="text-center">Year</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Loading employees...
                                    </TableCell>
                                </TableRow>
                            ) : currentTableRows.length > 0 ? (
                                currentTableRows.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <UserAvatar name={row.employeeName} size="sm" />
                                                <span className="font-medium">{row.employeeName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="capitalize">
                                            <Badge variant="outline" className="capitalize font-normal text-sm px-3 py-0.5">
                                                {row.leaveType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center font-medium">
                                            {row.allocated}
                                        </TableCell>
                                        <TableCell className="text-center text-muted-foreground">
                                            {row.carryForward}
                                        </TableCell>
                                        <TableCell className="text-center text-muted-foreground">
                                            {row.used}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                                {row.year}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        {allTableRows.length > 0 && loading
                                            ? "Loading allocations..."
                                            : "No allocations found."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Buttons */}
                <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-muted-foreground">
                        Total Allocations: {allTableRows.length}
                    </span>
                    <div className="flex gap-2">
                        <Button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                            Prev
                        </Button>
                        <span className="px-2 flex items-center">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
