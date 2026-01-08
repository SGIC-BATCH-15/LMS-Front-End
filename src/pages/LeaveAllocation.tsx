import React, { useState } from 'react';
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
import { UserAvatar } from '@/components/atoms/Avatar/UserAvatar';
import { Badge } from '@/components/ui/badge';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { toast } from 'sonner';

export const LeaveAllocation: React.FC = () => {
    // Consume persistend balances from AuthContext
    const { hasPermission, users, leaveBalances: balances, addLeaveBalances, updateLeaveBalance } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isAllocating, setIsAllocating] = useState(false);
    const [isCarryingForward, setIsCarryingForward] = useState(false);
    const itemsPerPage = 10;

    // Filter logic
    const filteredBalances = balances.filter((balance) => {
        const user = users.find((u) => u.id === balance.userId);
        if (!user) return false;

        // Search by employee name
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredBalances.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredBalances.slice(indexOfFirstItem, indexOfLastItem);

    const getEmployeeName = (userId: string) => {
        return users.find((u) => u.id === userId)?.name || 'Unknown';
    };

    const handleLeaveAllocation = () => {
        setIsAllocating(true);

        // Simulate backend processing time
        setTimeout(() => {
            // Check for users who don't have balances yet
            // We reverse the users array to find the MOST RECENTLY added user first
            // Check for users who don't have balances yet
            const usersWithBalances = new Set(balances.map(b => b.userId));

            // Find ALL users who don't have balances
            const newEmployees = users.filter(u => !usersWithBalances.has(u.id));

            if (newEmployees.length > 0) {
                // Simulate successful policy match and allocation for ALL new employees
                const allNewBalances = newEmployees.flatMap(emp => [
                    { id: `new-bal-${emp.id}-1`, userId: emp.id, leaveType: 'annual', total: 12, allocated: 12, carryForward: 0, used: 0, pending: 0, year: 2025 },
                    { id: `new-bal-${emp.id}-2`, userId: emp.id, leaveType: 'casual', total: 10, allocated: 10, carryForward: 0, used: 0, pending: 0, year: 2025 },
                    { id: `new-bal-${emp.id}-3`, userId: emp.id, leaveType: 'sick', total: 10, allocated: 10, carryForward: 0, used: 0, pending: 0, year: 2025 },
                ]);

                addLeaveBalances(allNewBalances as any); // Add to global state

                toast.success('Allocation Successful', {
                    description: `Successfully allocated leaves for ${newEmployees.length} new employee(s).`,
                    duration: 5000,
                });
            } else {
                toast.info('No Allocation Needed', {
                    description: 'No new eligible employees found for leave allocation. All employees already have allocations.',
                    duration: 5000,
                });
            }

            setIsAllocating(false);
        }, 2000);
    };

    const handleCarryForwardAllocation = () => {
        setIsCarryingForward(true);

        setTimeout(() => {
            // Logic: Find balances that have 0 carry forward days and are 'annual' (usually only annual carries forward)
            // For demo simplicity, we'll just check for ANY 0 carry forward in existing balances
            const eligibleBalances = balances.filter(b => b.carryForward === 0 && b.leaveType === 'annual');

            if (eligibleBalances.length > 0) {
                // Count unique employees affected
                const uniqueEmployees = new Set(eligibleBalances.map(b => b.userId));
                const employeeCount = uniqueEmployees.size;

                // Update first few/all found to simulate processing
                eligibleBalances.forEach(bal => {
                    const updatedBalance = {
                        ...bal,
                        carryForward: Math.floor(Math.random() * 5) + 1, // Add 1-5 days randomly
                        total: bal.total + (Math.floor(Math.random() * 5) + 1) // Also update total to reflect addition
                    };
                    updateLeaveBalance(updatedBalance);
                });

                toast.success('Process Completed', {
                    description: `Carry forward days added successfully for ${employeeCount} employee(s).`,
                    duration: 5000,
                });
            } else {
                toast.info('No Pending Allocations', {
                    description: 'There are no carry forward days pending allocation. All eligible records are up to date.',
                    duration: 5000,
                });
            }

            setIsCarryingForward(false);
        }, 2000);
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
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex gap-2">
                        {/* Secondary Button: Carry Forward Allocation */}
                        <Button
                            className="gap-2"
                            onClick={handleCarryForwardAllocation}
                            disabled={isCarryingForward}
                        >
                            <CalendarPlus className={isCarryingForward ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
                            {isCarryingForward ? 'Processing...' : 'Carry Forward Allocation'}
                        </Button>

                        {/* Primary Button: Leave Allocation */}
                        <Button
                            className="gap-2"
                            onClick={handleLeaveAllocation}
                            disabled={isAllocating}
                        >
                            <Plus className={isAllocating ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
                            {isAllocating ? 'Allocating...' : 'Leave Allocation'}
                        </Button>
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
                            {currentItems.length > 0 ? (
                                currentItems.map((balance) => {
                                    const employeeName = getEmployeeName(balance.userId);
                                    return (
                                        <TableRow key={balance.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <UserAvatar name={employeeName} size="sm" />
                                                    <span className="font-medium">{employeeName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="capitalize">
                                                <Badge variant="outline" className="capitalize font-normal text-sm px-3 py-0.5">
                                                    {balance.leaveType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center font-medium">
                                                {balance.allocated ?? balance.total}
                                            </TableCell>
                                            <TableCell className="text-center text-muted-foreground">
                                                {balance.carryForward ?? 0}
                                            </TableCell>
                                            <TableCell className="text-center text-muted-foreground">
                                                {balance.used}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                                    {balance.year}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No results found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    className={
                                        currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                                    }
                                />
                            </PaginationItem>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        isActive={page === currentPage}
                                        onClick={() => setCurrentPage(page)}
                                        className="cursor-pointer"
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    className={
                                        currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                                    }
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}
            </div>
        </DashboardLayout>
    );
};
