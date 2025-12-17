import React, { useState } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Shield } from 'lucide-react';
import { permissions } from '@/data/permissions';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
export const RolesPermissions: React.FC = () => {
    const { rolePermissions, updateRolePermission, roles: authRoles } = useAuth();
    const { toast } = useToast();


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
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Permission Matrix
                        </CardTitle>
                        <CardDescription>
                            Configure which permissions are granted to each role
                        </CardDescription>
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
            </div>
        </DashboardLayout>
    );
};
