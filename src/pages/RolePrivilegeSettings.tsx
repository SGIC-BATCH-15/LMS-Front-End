import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Role } from '@/data/roles';
import { roleService } from '@/components/services/roleService';

// Type for tracking role privilege permissions
interface FeaturePermission {
    featureId: string;
    featureName: string;
    permission: 'read' | 'write' | 'maintain' | 'none'; // Only one can be selected
}

interface RolePrivilegesMap {
    [roleId: string]: FeaturePermission[];
}

// Sample features data
const systemFeatures: FeaturePermission[] = [
    { featureId: 'dashboard', featureName: 'Dashboard', permission: 'none' },
    { featureId: 'employees', featureName: 'Employees Management', permission: 'none' },
    { featureId: 'leave_requests', featureName: 'Leave Requests', permission: 'none' },
    { featureId: 'leave_approvals', featureName: 'Leave Approvals', permission: 'none' },
    { featureId: 'departments', featureName: 'Departments', permission: 'none' },
    { featureId: 'designations', featureName: 'Designations', permission: 'none' },
    { featureId: 'roles', featureName: 'Roles Management', permission: 'none' },
    { featureId: 'leave_types', featureName: 'Leave Types', permission: 'none' },
    { featureId: 'leave_policies', featureName: 'Leave Policies', permission: 'none' },
    { featureId: 'reports', featureName: 'Reports & Analytics', permission: 'none' },
    { featureId: 'email_config', featureName: 'Email Configuration', permission: 'none' },
    { featureId: 'holiday_config', featureName: 'Holiday Configuration', permission: 'none' },
];

export const RolePrivilegeSettings: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [rolePrivileges, setRolePrivileges] = useState<RolePrivilegesMap>({});
    const [isLoading, setIsLoading] = useState(true);

    // Fetch roles on component mount
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                setIsLoading(true);
                const fetchedRoles = await roleService.getAllRoles();
                if (Array.isArray(fetchedRoles)) {
                    setRoles(fetchedRoles);
                    if (fetchedRoles.length > 0) {
                        setSelectedRole(fetchedRoles[0].id);
                    }
                }
            } catch (error) {
                console.error('Error fetching roles:', error);
                setRoles([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRoles();
    }, []);

    // Initialize role privileges on roles load
    useEffect(() => {
        if (roles.length > 0) {
            const initialPrivileges: RolePrivilegesMap = {};
            roles.forEach((role) => {
                initialPrivileges[role.id] = systemFeatures.map((feature) => ({
                    ...feature,
                }));
            });
            setRolePrivileges(initialPrivileges);
        }
    }, [roles]);

    // Get current role and features
    const currentRole = roles.find((r) => r.id === selectedRole);
    const currentFeatures = selectedRole ? rolePrivileges[selectedRole] || [] : [];

    // Handle permission checkbox change
    const handlePermissionChange = (
        featureId: string,
        permissionType: 'read' | 'write' | 'maintain' | 'none'
    ) => {
        if (!selectedRole) return;

        setRolePrivileges((prev) => ({
            ...prev,
            [selectedRole]: prev[selectedRole].map((feature) =>
                feature.featureId === featureId
                    ? { ...feature, permission: permissionType }
                    : feature
            ),
        }));
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Role Privilege Settings</h1>
                    <p className="text-muted-foreground">
                        Configure feature permissions for each role
                    </p>
                </div>

                {/* Role Selection Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Select Role</CardTitle>
                        <CardDescription>
                            Choose a role to manage its feature permissions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="role-select" className="text-sm font-medium">
                                Role
                            </Label>
                            {isLoading ? (
                                <div className="text-sm text-muted-foreground">Loading roles...</div>
                            ) : (
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                    <SelectTrigger id="role-select" className="w-full sm:w-96">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.length > 0 ? (
                                            roles.map((role) => (
                                                <SelectItem key={role.id} value={role.id}>
                                                    {role.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-2 text-sm text-muted-foreground">
                                                No roles available
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Privileges Table Card */}
                {currentRole && !isLoading && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Permissions for {currentRole.name}</CardTitle>
                            <CardDescription>
                                Manage feature access permissions (Read, Write, Maintain)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableHead className="w-2/5">Feature Name</TableHead>
                                            <TableHead className="w-1/5 text-center">Read</TableHead>
                                            <TableHead className="w-1/5 text-center">Write</TableHead>
                                            <TableHead className="w-1/5 text-center">Maintain</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentFeatures.length > 0 ? (
                                            currentFeatures.map((feature) => (
                                                <TableRow key={feature.featureId} className="hover:bg-muted/50">
                                                    <TableCell className="font-medium">
                                                        {feature.featureName}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Checkbox
                                                            checked={feature.permission === 'read'}
                                                            onCheckedChange={(checked) =>
                                                                handlePermissionChange(
                                                                    feature.featureId,
                                                                    checked ? 'read' : 'none'
                                                                )
                                                            }
                                                            className="cursor-pointer"
                                                            aria-label={`Read permission for ${feature.featureName}`}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Checkbox
                                                            checked={feature.permission === 'write'}
                                                            onCheckedChange={(checked) =>
                                                                handlePermissionChange(
                                                                    feature.featureId,
                                                                    checked ? 'write' : 'none'
                                                                )
                                                            }
                                                            className="cursor-pointer"
                                                            aria-label={`Write permission for ${feature.featureName}`}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Checkbox
                                                            checked={feature.permission === 'maintain'}
                                                            onCheckedChange={(checked) =>
                                                                handlePermissionChange(
                                                                    feature.featureId,
                                                                    checked ? 'maintain' : 'none'
                                                                )
                                                            }
                                                            className="cursor-pointer"
                                                            aria-label={`Maintain permission for ${feature.featureName}`}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                    No features available
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};
