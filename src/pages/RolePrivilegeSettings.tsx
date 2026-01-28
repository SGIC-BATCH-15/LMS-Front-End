import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/components/services/apiClient';
import { Shield, Loader2 } from 'lucide-react';
import { useRolePrivilege } from '@/context/RolePrivilegeContext';

interface Role {
    id: number;
    name: string;
}

interface Privilege {
    id: number;
    name: string;
    code: string;
    category: string;
}

interface RolePrivilege {
    id?: number;
    roleId: number;
    privilegeId: number;
    canRead: boolean;
    canWrite: boolean;
    canUpdate: boolean;
    canDelete: boolean;
}

export const RolePrivilegeSettings: React.FC = () => {
    const { hasRolePrivilege } = useRolePrivilege();
    const [roles, setRoles] = useState<Role[]>([]);
    const [privileges, setPrivileges] = useState<Privilege[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState<string>('');
    const [rolePrivileges, setRolePrivileges] = useState<Record<number, RolePrivilege>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [rolesRes, privilegesRes] = await Promise.all([
                apiClient.get('/settings/roles/get'),
                apiClient.get('/company-privileges/mine'),
            ]);

            // Handle the ResponseWrapper structure for roles
            const rolesData = rolesRes.data.data.roles || rolesRes.data.data || [];

            // Company Privileges endpoint returns CompanyPrivilegeResponseDto which has a list of 'privileges'
            // We need to extract that list.
            const privilegesData = privilegesRes.data.privileges || [];

            setRoles(rolesData);
            setPrivileges(privilegesData);

            if (rolesData.length > 0) {
                setSelectedRoleId(rolesData[0].id.toString());
                fetchRolePrivileges(rolesData[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load roles or privileges.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchRolePrivileges = async (roleId: number) => {
        try {
            const res = await apiClient.get(`/settings/role-privileges/role/${roleId}`);
            const data: any[] = res.data.data || [];

            const privilegeMap: Record<number, RolePrivilege> = {};
            data.forEach((item) => {
                privilegeMap[item.privilegeId] = {
                    id: item.id,
                    roleId: item.roleId,
                    privilegeId: item.privilegeId,
                    canRead: item.canRead,
                    canWrite: item.canWrite,
                    canUpdate: item.canUpdate,
                    canDelete: item.canDelete,
                };
            });
            setRolePrivileges(privilegeMap);
        } catch (error) {
            console.error('Failed to fetch role privileges:', error);
        }
    };

    const handleRoleChange = (roleId: string) => {
        setSelectedRoleId(roleId);
        fetchRolePrivileges(parseInt(roleId));
    };

    const handleToggle = async (privilegeId: number, field: keyof RolePrivilege) => {
        const current = rolePrivileges[privilegeId] || {
            roleId: Number(selectedRoleId),
            privilegeId,
            canRead: false,
            canWrite: false,
            canUpdate: false,
            canDelete: false,
        };

        const updated = { ...current, [field]: !current[field] };

        // Optimistic update
        setRolePrivileges({ ...rolePrivileges, [privilegeId]: updated });

        try {
            await apiClient.post('/settings/role-privileges/assign', updated);
            toast({
                title: 'Success',
                description: 'Privilege updated successfully.',
            });
        } catch (error) {
            // Revert on error
            setRolePrivileges({ ...rolePrivileges, [privilegeId]: current });
            toast({
                title: 'Error',
                description: 'Failed to update privilege.',
                variant: 'destructive',
            });
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="Role Privileges">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Role Privileges" subtitle="Configure granular CRUD permissions for each role">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Role Selection</CardTitle>
                                <CardDescription>Select a role to manage its permissions</CardDescription>
                            </div>
                            <div className="w-64">
                                <Select value={selectedRoleId} onValueChange={handleRoleChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={role.id.toString()}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Privilege Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[300px]">Feature (Privilege Code)</TableHead>
                                        <TableHead className="text-center">Read</TableHead>
                                        <TableHead className="text-center">Write (Create)</TableHead>
                                        <TableHead className="text-center">Update</TableHead>
                                        <TableHead className="text-center">Delete</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {privileges.map((privilege) => {
                                        const rp = rolePrivileges[privilege.id] || {
                                            canRead: false,
                                            canWrite: false,
                                            canUpdate: false,
                                            canDelete: false,
                                        };
                                        return (
                                            <TableRow key={privilege.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{privilege.name}</p>
                                                        <p className="text-xs text-muted-foreground">{privilege.code}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Checkbox
                                                        checked={rp.canRead}
                                                        onCheckedChange={() => handleToggle(privilege.id, 'canRead')}
                                                        disabled={!hasRolePrivilege('ROLE_PRIVILEGE', 'canUpdate')}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Checkbox
                                                        checked={rp.canWrite}
                                                        onCheckedChange={() => handleToggle(privilege.id, 'canWrite')}
                                                        disabled={!hasRolePrivilege('ROLE_PRIVILEGE', 'canUpdate')}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Checkbox
                                                        checked={rp.canUpdate}
                                                        onCheckedChange={() => handleToggle(privilege.id, 'canUpdate')}
                                                        disabled={!hasRolePrivilege('ROLE_PRIVILEGE', 'canUpdate')}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Checkbox
                                                        checked={rp.canDelete}
                                                        onCheckedChange={() => handleToggle(privilege.id, 'canDelete')}
                                                        disabled={!hasRolePrivilege('ROLE_PRIVILEGE', 'canUpdate')}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};
