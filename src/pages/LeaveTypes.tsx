import React, { useState } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LeaveTypeConfig {
    id: string;
    displayName: string;
    color: string;
}

const initialLeaveTypes: LeaveTypeConfig[] = [
    { id: '1', displayName: 'Annual Leave', color: 'bg-blue-500' },
    { id: '2', displayName: 'Sick Leave', color: 'bg-red-500' },
    { id: '3', displayName: 'Casual Leave', color: 'bg-green-500' },
    { id: '4', displayName: 'Maternity Leave', color: 'bg-pink-500' },
    { id: '5', displayName: 'Paternity Leave', color: 'bg-purple-500' },
    { id: '6', displayName: 'Unpaid Leave', color: 'bg-yellow-500' },
];

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
    const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>(initialLeaveTypes);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<LeaveTypeConfig | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ displayName: '' });
    const { toast } = useToast();

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

    const handleSave = () => {
        if (!formData.displayName.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a leave type name',
                variant: 'destructive',
            });
            return;
        }

        if (editingType) {
            setLeaveTypes(leaveTypes.map(lt =>
                lt.id === editingType.id ? { ...lt, displayName: formData.displayName } : lt
            ));
            toast({
                title: 'Success',
                description: 'Leave type updated successfully',
            });
        } else {
            // Assign random color
            const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
            const newType: LeaveTypeConfig = {
                id: Date.now().toString(),
                displayName: formData.displayName,
                color: randomColor,
            };
            setLeaveTypes([...leaveTypes, newType]);
            toast({
                title: 'Success',
                description: 'Leave type created successfully',
            });
        }
        setIsDialogOpen(false);
    };

    const handleDelete = (id: string) => {
        setLeaveTypes(leaveTypes.filter(lt => lt.id !== id));
        toast({
            title: 'Success',
            description: 'Leave type deleted successfully',
        });
    };

    const filteredLeaveTypes = leaveTypes.filter(lt =>
        lt.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                            <Button onClick={() => handleOpenDialog()}>
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
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ACTION
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredLeaveTypes.map((leaveType) => (
                                    <tr key={leaveType.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${leaveType.color}`} />
                                                <span className="text-sm text-gray-900">{leaveType.displayName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex justify-end gap-2">
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
                            <Button onClick={handleSave}>
                                {editingType ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};
