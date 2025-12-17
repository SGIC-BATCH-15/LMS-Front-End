import React, { useState } from 'react';
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
import { designationsList, Designation } from '@/data/designationsList';

export const Designations: React.FC = () => {
    const [designations, setDesignations] = useState<Designation[]>(designationsList);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newDesignationName, setNewDesignationName] = useState('');
    const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);

    const handleOpenDialog = (designation?: Designation) => {
        if (designation) {
            setEditingDesignation(designation);
            setNewDesignationName(designation.name);
        } else {
            setEditingDesignation(null);
            setNewDesignationName('');
        }
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (!newDesignationName.trim()) {
            toast.error('Please enter a designation name');
            return;
        }

        if (editingDesignation) {
            // Update existing designation
            setDesignations(prev => prev.map(d =>
                d.id === editingDesignation.id ? { ...d, name: newDesignationName.trim() } : d
            ));
            toast.success('Designation updated successfully');
        } else {
            // Create new designation
            const newDesignation: Designation = {
                id: `des-${Date.now()}`,
                name: newDesignationName.trim()
            };
            setDesignations([...designations, newDesignation]);
            toast.success('Designation added successfully');
        }

        setIsDialogOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this designation?')) {
            setDesignations(designations.filter(d => d.id !== id));
            toast.success('Designation deleted successfully');
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
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {designations.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        {item.name}
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
                                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
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
