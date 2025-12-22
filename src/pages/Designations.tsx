import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Designation } from '@/data/designationsList';
import designationService from '@/components/services/designationService';
import { departmentService } from '@/components/services/departmentService';
import { Department } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const Designations: React.FC = () => {
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newDesignationName, setNewDesignationName] = useState('');
    const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDeptId, setSelectedDeptId] = useState<string>('');

    const handleOpenDialog = (designation?: Designation) => {
        if (designation) {
            setEditingDesignation(designation);
            setNewDesignationName(designation.name);
            // set selected department from normalized fields if present
            const deptId = (designation as any).departmentId || (designation as any).department?.id || (designation as any).department_id;
            setSelectedDeptId(deptId ? deptId.toString() : '');
        } else {
            setEditingDesignation(null);
            setNewDesignationName('');
            setSelectedDeptId('');
        }
        setIsDialogOpen(true);
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const deps = await departmentService.getDepartmentsByCompanyId('1');
                setDepartments(deps);
                const data = await designationService.getAll();
                // normalize department id/name if backend uses department_id
                const normalized = (data || []).map((d: any) => ({
                    ...d,
                    departmentId: d.department_id?.toString() || d.departmentId || d.department?.id?.toString(),
                    departmentName: d.department?.name || d.departmentName || d.department_name || ''
                }));
                // if missing departmentName, try to derive from departments list
                normalized.forEach((n: any) => {
                    if (!n.departmentName && n.departmentId) {
                        const found = deps.find(x => x.id.toString() === n.departmentId.toString());
                        if (found) n.departmentName = (found.departmentName || found.name || '');
                    }
                });
                setDesignations(normalized);
            } catch (err) {
                toast.error('Failed to load designations or departments');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        if (!newDesignationName.trim()) {
            toast.error('Please enter a designation name');
            return;
        }
        if (!selectedDeptId) {
            toast.error('Please select a department');
            return;
        }

        try {
            if (editingDesignation) {
                    const updated = await designationService.update(editingDesignation.id, newDesignationName.trim(), selectedDeptId);
                    console.log('Designations: update response', updated);
                const normalized = {
                    ...updated,
                    departmentId: updated.department_id?.toString() || selectedDeptId,
                    departmentName: updated.department?.name || departments.find(d => d.id.toString() === selectedDeptId)?.name || ''
                } as any;
                setDesignations(prev => prev.map(d => d.id === normalized.id ? normalized : d));
                toast.success('Designation updated successfully');
            } else {
                const created = await designationService.add(newDesignationName.trim(), selectedDeptId);
                console.log('Designations: create response', created);
                const normalized = {
                    ...created,
                    departmentId: created.department_id?.toString() || selectedDeptId,
                    departmentName: created.department?.name || departments.find(d => d.id.toString() === selectedDeptId)?.name || ''
                } as any;
                setDesignations(prev => [...prev, normalized]);
                toast.success('Designation added successfully');
            }
            setIsDialogOpen(false);
        } catch (err: any) {
            // try to extract meaningful validation/server message
            const getMessage = (error: any) => {
                if (!error) return 'Something went wrong';
                const resp = error.response;

                // Handle HTTP 400 (validation) specifically
                if (resp && resp.status === 400) {
                    const data = resp.data;
                    // Common backend: data.data as array of validation errors
                    if (data?.data && Array.isArray(data.data)) {
                        return data.data.map((d: any) => d.message || d).join('. ');
                    }

                    // data.data may be an object mapping fields to messages array
                    if (data?.data && typeof data.data === 'object') {
                        const parts: string[] = [];
                        Object.keys(data.data).forEach((k) => {
                            const v = data.data[k];
                            if (Array.isArray(v)) parts.push(...v.map((x: any) => (x.message ? x.message : x)));
                            else if (typeof v === 'string') parts.push(v);
                            else if (v?.message) parts.push(v.message);
                        });
                        if (parts.length) return parts.join('. ');
                    }

                    // data.errors as an array
                    if (data?.errors && Array.isArray(data.errors)) return data.errors.map((e: any) => e.message || e).join('. ');

                    // fallback to message/statusMessage inside 400 response
                    if (data?.message) return data.message;
                    if (data?.statusMessage) return data.statusMessage;
                }

                // Non-400 or fallback parsing
                const body = (resp && resp.data) || error;
                if (body?.message) return body.message;
                if (body?.statusMessage) return body.statusMessage;
                if (body?.error) return body.error;
                if (body?.data && typeof body.data === 'string') return body.data;
                if (body?.data && Array.isArray(body.data)) return body.data.map((d: any) => d.message || d).join(', ');
                if (error.message) return error.message;
                return 'Operation failed. Please check input and try again.';
            };

            const userMessage = getMessage(err);
            console.error('Designations: save error', err);
            toast.error(userMessage);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this designation?')) return;
        try {
            await designationService.remove(id);
            setDesignations(prev => prev.filter(d => d.id !== id));
            toast.success('Designation deleted successfully');
        } catch (err) {
            toast.error('Failed to delete designation');
        }
    };

    return (
        <DashboardLayout
            title="Designations"
            subtitle="Manage master list of designations"
        >
            <div className="space-y-6">
                {/* Header with Add Button */}
                <div className="flex justify-between items-center">
                    <p className="text-muted-foreground">
                        Add and manage job titles available in the system
                    </p>
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Designation
                    </Button>
                </div>

                {/* Designations Table */}
                <div className="border rounded-lg bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Designation Name</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {designations.map((item) => (
                                <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            {item.name}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">{(item as any).departmentName || (item as any).department?.name || '-'}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenDialog(item)}
                                                title="Edit designation"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(item.id)}
                                                title="Delete designation"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {designations.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                        No designations found. Add one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Add/Edit Designation Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>
                                {editingDesignation ? 'Edit Designation' : 'Add New Designation'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingDesignation
                                    ? 'Update the job title details.'
                                    : 'Create a new job title to be used in employee records.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Designation Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={newDesignationName}
                                    onChange={(e) => setNewDesignationName(e.target.value)}
                                    placeholder="e.g. Senior Software Engineer"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="department">Department <span className="text-red-500">*</span></Label>
                                <Select value={selectedDeptId} onValueChange={(v) => setSelectedDeptId(v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={departments.length === 0 ? 'Loading departments...' : 'Select Department'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.length === 0 ? (
                                            <SelectItem value="">No departments</SelectItem>
                                        ) : (
                                            departments.map(dept => (
                                                <SelectItem key={dept.id} value={dept.id.toString()}>{dept.departmentName || dept.name}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave}>
                                {editingDesignation ? 'Update' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};
