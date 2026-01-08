import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    getAllLeaveTypes,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
    LeaveTypeResponseDto
} from '@/components/services/leavetypeService';


interface LeaveTypeConfig {
    id: string;
    displayName: string;
    color: string;
}

const availableColors = [
    'bg-blue-500',
    'bg-red-500',
    'bg-green-500',
    'bg-pink-500',
    'bg-purple-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-orange-500',
    'bg-teal-500',
];

export const LeaveTypes: React.FC = () => {
    const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<LeaveTypeConfig | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ displayName: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const { toast } = useToast();

    const fetchLeaveTypes = async () => {
        try {
            const response = await getAllLeaveTypes(0, 100); // Fetching all for now
            const mappedTypes = response.content.map((lt: LeaveTypeResponseDto, index: number) => ({
                id: lt.id.toString(),
                displayName: lt.leaveType,
                color: availableColors[index % availableColors.length] // Assign color based on index
            }));
            // Sort with newest first (reverse order by ID)
            mappedTypes.sort((a, b) => parseInt(b.id) - parseInt(a.id));
            setLeaveTypes(mappedTypes);
        } catch (error) {
            console.error("Failed to fetch leave types", error);
            toast({
                title: 'Error',
                description: 'Failed to fetch leave types',
                variant: 'destructive',
            });
        }
    };

    useEffect(() => {
        fetchLeaveTypes();
    }, []);

    const handleOpenDialog = (leaveType?: LeaveTypeConfig) => {
        if (leaveType) {
            setEditingType(leaveType);
            setFormData({ displayName: leaveType.displayName });
        } else {
            setEditingType(null);
            setFormData({ displayName: '' });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.displayName.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a leave type name',
                variant: 'destructive',
            });
            return;
        }

        try {
            if (editingType) {
                await updateLeaveType(Number(editingType.id), { leaveType: formData.displayName });
                toast({
                    title: 'Success',
                    description: 'Leave type updated successfully',
                });
            } else {
                await createLeaveType({ leaveType: formData.displayName });
                toast({
                    title: 'Success',
                    description: 'Leave type created successfully',
                });
            }
            setIsDialogOpen(false);
            fetchLeaveTypes();
        } catch (error) {
            console.error("Failed to save leave type", error);
            toast({
                title: 'Error',
                description: 'Failed to save leave type',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteLeaveType(Number(id));
            toast({
                title: 'Success',
                description: 'Leave type deleted successfully',
                variant: 'default',
            });
            fetchLeaveTypes();
        } catch (error) {
            console.error("Failed to delete leave type", error);
            toast({
                title: 'Error',
                description: 'Failed to delete leave type',
                variant: 'destructive',
            });
        }
    };

    const filteredLeaveTypes = leaveTypes.filter(lt =>
        lt.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Client-Side Pagination Logic
    const totalPages = Math.max(1, Math.ceil(filteredLeaveTypes.length / itemsPerPage));
    const currentItems = filteredLeaveTypes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <DashboardLayout title="Leave Types" subtitle="Configure different types of leaves">
            <div className="space-y-6">
                {/* Card with Search and Table */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Leave Types</h2>
                                <p className="text-sm text-gray-500 mt-1">Manage available leave types</p>
                            </div>
                            <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Leave Type
                            </Button>
                        </div>
                        {/* Search */}
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search leave types..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        LEAVE TYPE NAME
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ACTION
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentItems.map((leaveType) => (
                                    <tr key={leaveType.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${leaveType.color}`} />
                                                <span className="text-sm text-gray-900">{leaveType.displayName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenDialog(leaveType)}
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(leaveType.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-muted-foreground">
                            Total Leave Types: {filteredLeaveTypes.length}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <span className="px-2 flex items-center">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}

                {/* Add/Edit Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingType ? 'Edit Leave Type' : 'Add Leave Type'}</DialogTitle>
                            <DialogDescription>
                                Enter leave type name to {editingType ? 'update' : 'add a new'} leave type
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <div className="space-y-2">
                                <Label htmlFor="displayName">
                                    Leave Type Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="displayName"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ displayName: e.target.value })}
                                    placeholder="e.g., Annual Leave"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                                {editingType ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};
