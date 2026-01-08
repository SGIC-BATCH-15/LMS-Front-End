import React, { useState } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { Shield, Plus } from 'lucide-react';
import { Permission } from '@/data/permissions';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
export const RolesPermissions: React.FC = () => {
    const { rolePermissions, updateRolePermission, roles: authRoles, permissions, addPermission } = useAuth();
    const { toast } = useToast();

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });


    // Use roles from AuthContext
    const roles = authRoles.map(r => ({
        role: r.key as UserRole,
        label: r.name,
        description: r.description,
        color: r.color
    }));

    const togglePermission = (role: UserRole, permissionId: string) => {
        const hasAccess = rolePermissions[role]?.has(permissionId) || false;

        // Optimistically update
        updateRolePermission(role, permissionId, !hasAccess);

        toast({
            title: 'Permission Updated',
            description: `Permission ${!hasAccess ? 'granted' : 'revoked'} for ${role}`,
        });
    };

    const hasPermission = (role: UserRole, permissionId: string): boolean => {
        return rolePermissions[role]?.has(permissionId) || false;
    };

    // Auto-generate permission ID from name
    const generatePermissionId = (name: string): string => {
        return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    };

    const handleOpenDialog = () => {
        setFormData({ name: '', description: '' });
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setFormData({ name: '', description: '' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.description) {
            toast({
                title: 'Validation Error',
                description: 'Please fill in all fields',
                variant: 'destructive',
            });
            return;
        }

        const permissionId = generatePermissionId(formData.name);

        // Check if permission ID already exists
        if (permissions.find(p => p.id === permissionId)) {
            toast({
                title: 'Permission Exists',
                description: 'A permission with this name already exists',
                variant: 'destructive',
            });
            return;
        }

        const newPermission: Permission = {
            id: permissionId,
            name: formData.name,
            description: formData.description,
            isSystem: false,
        };

        addPermission(newPermission);

        toast({
            title: 'Permission Added',
            description: `Permission "${formData.name}" has been added successfully`,
        });

        handleCloseDialog();
    };

    return (
        <DashboardLayout title="Roles & Permissions" subtitle="Manage role-based access control">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md://grid-cols-3 gap-4">
                    {roles.map(({ role, label, description, color }) => (
                        <Card key={role}>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${color}`} />
                                    <CardTitle>{label}</CardTitle>
                                </div>
                                <CardDescription>{description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Active Permissions</span>
                                    <Badge variant="secondary">
                                        {rolePermissions[role]?.size || 0} / {permissions.length}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Permission Matrix
                                </CardTitle>
                                <CardDescription>
                                    Configure which permissions are granted to each role
                                </CardDescription>
                            </div>
                            <Button onClick={handleOpenDialog}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Permission
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[300px]">Permission</TableHead>
                                        {roles.map(({ role, label }) => (
                                            <TableHead key={role} className="text-center">
                                                {label}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {permissions.map((permission) => (
                                        <TableRow key={permission.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{permission.name}</p>
                                                    <p className="text-xs text-muted-foreground">{permission.description}</p>
                                                </div>
                                            </TableCell>
                                            {roles.map(({ role }) => (
                                                <TableCell key={`${permission.id}-${role}`} className="text-center">
                                                    <div className="flex justify-center">
                                                        <Switch
                                                            checked={hasPermission(role, permission.id)}
                                                            onCheckedChange={() => togglePermission(role, permission.id)}
                                                        />
                                                    </div>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Add Permission Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add New Permission</DialogTitle>
                            <DialogDescription>
                                Create a custom permission for your application features
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="permission-name">
                                        Permission Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="permission-name"
                                        placeholder="e.g., Manage Holidays"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                    {formData.name && (
                                        <p className="text-xs text-muted-foreground">
                                            ID: {generatePermissionId(formData.name)}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="permission-description">
                                        Description <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="permission-description"
                                        placeholder="e.g., Configure company holidays and observances"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    Create Permission
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};
