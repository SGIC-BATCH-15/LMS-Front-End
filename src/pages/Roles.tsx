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
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Role } from '@/data/roles';
import { useAuth } from '@/context/AuthContext';

export const Roles: React.FC = () => {
    const { roles, addRole, updateRole, deleteRole } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState({
        name: '',
    });

    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenDialog = (role?: Role) => {
        if (role) {
            setEditingRole(role);
            setFormData({
                name: role.name,
            });
        } else {
            setEditingRole(null);
            setFormData({
                name: '',
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingRole(null);
        setFormData({
            name: '',
        });
    };

    const handleSave = () => {
        if (!formData.name) {
            toast.error('Please enter a role name');
            return;
        }

        if (editingRole) {
            // Update existing role
            updateRole({
                ...editingRole,
                name: formData.name,
                // Ensure key is updated if needed, but usually keys are static for system roles
                // For custom roles, we might want to update the key or keep it
                key: editingRole.isSystem ? editingRole.key : formData.name.toLowerCase().replace(/\s+/g, '_')
            });
            toast.success('Role updated successfully');
        } else {
            // Add new role
            const newRole: Role = {
                id: Date.now().toString(),
                key: formData.name.toLowerCase().replace(/\s+/g, '_'),
                name: formData.name,
                description: 'Custom role',
                color: 'bg-gray-500',
                isSystem: false,
            };
            addRole(newRole);
            toast.success('Role added successfully');
        }

        handleCloseDialog();
    };

    const handleDelete = (role: Role) => {
        // User requested ability to delete ALL roles
        if (window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
            deleteRole(role.id);
            toast.success('Role deleted successfully');
        }
    };

    return (
        <DashboardLayout
            title="Role Management"
            subtitle="Manage user roles"
        >
            <div className="space-y-6">
                {/* Header with Add Button */}
                <div className="flex justify-between items-center">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search roles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Role
                    </Button>
                </div>

                {/* Roles Table */}
                <div className="border rounded-lg bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role Name</TableHead>

                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRoles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                                        No roles found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRoles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${role.color}`} />
                                                {role.name}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenDialog(role)}
                                                    title="Edit role"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(role)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    title="Delete role"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Add/Edit Role Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>
                                {editingRole ? 'Edit Role' : 'Add Role'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingRole
                                    ? 'Update role name'
                                    : 'Enter name for the new role'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Role Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Supervisor"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleCloseDialog}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave}>
                                {editingRole ? 'Update' : 'Create'} Role
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};
