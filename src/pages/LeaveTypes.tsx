import React, { useState } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tags, Plus, Pencil, Trash2 } from 'lucide-react';
import { LeaveType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface LeaveTypeConfig {
    id: string;
    type: LeaveType;
    displayName: string;
    color: string;
    description: string;
    requiresApproval: boolean;
    canCarryForward: boolean;
    maxDaysPerYear: number;
    isActive: boolean;
}

const initialLeaveTypes: LeaveTypeConfig[] = [
    {
        id: '1',
        type: 'annual',
        displayName: 'Annual Leave',
        color: 'bg-blue-500',
        description: 'Paid time off for vacation and personal time',
        requiresApproval: true,
        canCarryForward: true,
        maxDaysPerYear: 25,
        isActive: true,
    },
    {
        id: '2',
        type: 'sick',
        displayName: 'Sick Leave',
        color: 'bg-red-500',
        description: 'Leave for medical reasons and health issues',
        requiresApproval: false,
        canCarryForward: false,
        maxDaysPerYear: 15,
        isActive: true,
    },
    {
        id: '3',
        type: 'casual',
        displayName: 'Casual Leave',
        color: 'bg-green-500',
        description: 'Short notice leave for personal matters',
        requiresApproval: true,
        canCarryForward: false,
        maxDaysPerYear: 12,
        isActive: true,
    },
    {
        id: '4',
        type: 'maternity',
        displayName: 'Maternity Leave',
        color: 'bg-pink-500',
        description: 'Leave for childbirth and childcare',
        requiresApproval: true,
        canCarryForward: false,
        maxDaysPerYear: 90,
        isActive: true,
    },
    {
        id: '5',
        type: 'paternity',
        displayName: 'Paternity Leave',
        color: 'bg-purple-500',
        description: 'Leave for new fathers',
        requiresApproval: true,
        canCarryForward: false,
        maxDaysPerYear: 14,
        isActive: true,
    },
    {
        id: '6',
        type: 'unpaid',
        displayName: 'Unpaid Leave',
        color: 'bg-gray-500',
        description: 'Leave without pay',
        requiresApproval: true,
        canCarryForward: false,
        maxDaysPerYear: 30,
        isActive: true,
    },
];

export const LeaveTypes: React.FC = () => {
    const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>(initialLeaveTypes);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<LeaveTypeConfig | null>(null);
    const [formData, setFormData] = useState<Partial<LeaveTypeConfig>>({});
    const { toast } = useToast();

    const handleOpenDialog = (leaveType?: LeaveTypeConfig) => {
        if (leaveType) {
            setEditingType(leaveType);
            setFormData(leaveType);
        } else {
            setEditingType(null);
            setFormData({
                displayName: '',
                description: '',
                requiresApproval: true,
                canCarryForward: false,
                maxDaysPerYear: 10,
                isActive: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (!formData.displayName || !formData.description) {
            toast({
                title: 'Error',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            return;
        }

        if (editingType) {
            setLeaveTypes(leaveTypes.map(lt =>
                lt.id === editingType.id ? { ...lt, ...formData } as LeaveTypeConfig : lt
            ));
            toast({
                title: 'Success',
                description: 'Leave type updated successfully',
            });
        } else {
            const newType: LeaveTypeConfig = {
                id: Date.now().toString(),
                type: 'annual',
                color: 'bg-blue-500',
                ...formData,
            } as LeaveTypeConfig;
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

    const toggleActive = (id: string) => {
        setLeaveTypes(leaveTypes.map(lt =>
            lt.id === id ? { ...lt, isActive: !lt.isActive } : lt
        ));
    };

    return (
        <DashboardLayout title="Leave Types" subtitle="Configure different types of leaves">
            <div className="space-y-6">
                <div className="flex justify-end items-center">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => handleOpenDialog()}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Leave Type
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{editingType ? 'Edit Leave Type' : 'Add New Leave Type'}</DialogTitle>
                                <DialogDescription>
                                    Configure leave type settings and policies
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="displayName">Display Name</Label>
                                        <Input
                                            id="displayName"
                                            value={formData.displayName || ''}
                                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                            placeholder="e.g., Annual Leave"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maxDays">Max Days Per Year</Label>
                                        <Input
                                            id="maxDays"
                                            type="number"
                                            value={formData.maxDaysPerYear || 0}
                                            onChange={(e) => setFormData({ ...formData, maxDaysPerYear: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Input
                                        id="description"
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief description of this leave type"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="requiresApproval">Requires Approval</Label>
                                    <Switch
                                        id="requiresApproval"
                                        checked={formData.requiresApproval || false}
                                        onCheckedChange={(checked) => setFormData({ ...formData, requiresApproval: checked })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="canCarryForward">Can Carry Forward</Label>
                                    <Switch
                                        id="canCarryForward"
                                        checked={formData.canCarryForward || false}
                                        onCheckedChange={(checked) => setFormData({ ...formData, canCarryForward: checked })}
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

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tags className="w-5 h-5" />
                            Leave Type Configuration
                        </CardTitle>
                        <CardDescription>
                            Manage available leave types and their settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Leave Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-center">Max Days</TableHead>
                                    <TableHead className="text-center">Approval Required</TableHead>
                                    <TableHead className="text-center">Carry Forward</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaveTypes.map((leaveType) => (
                                    <TableRow key={leaveType.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${leaveType.color}`} />
                                                <span className="font-medium">{leaveType.displayName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {leaveType.description}
                                        </TableCell>
                                        <TableCell className="text-center">{leaveType.maxDaysPerYear}</TableCell>
                                        <TableCell className="text-center">
                                            {leaveType.requiresApproval ? (
                                                <Badge variant="secondary">Yes</Badge>
                                            ) : (
                                                <Badge variant="outline">No</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {leaveType.canCarryForward ? (
                                                <Badge variant="secondary">Yes</Badge>
                                            ) : (
                                                <Badge variant="outline">No</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Switch
                                                checked={leaveType.isActive}
                                                onCheckedChange={() => toggleActive(leaveType.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDialog(leaveType)}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(leaveType.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};
