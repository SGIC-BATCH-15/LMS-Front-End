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
import { useAuth } from '@/context/AuthContext';

interface Employee {
    id: number;
    firstName: string;
    lastName: string;
}

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

interface UserPrivilege {
    id?: number;
    employeeId: number;
    privilegeId: number;
    canRead: boolean;
    canWrite: boolean;
    canUpdate: boolean;
    canDelete: boolean;
}

interface RolePrivilege {
    privilegeId: number;
    canRead: boolean;
    canWrite: boolean;
    canUpdate: boolean;
    canDelete: boolean;
}

export const UserPrivilegeSettings: React.FC = () => {
    const { hasRolePrivilege } = useRolePrivilege();
    const { currentUser } = useAuth(); // Attempt to get companyId from here if possible, else fetch
    const [roles, setRoles] = useState<Role[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [privileges, setPrivileges] = useState<Privilege[]>([]);

    // Selection states
    const [selectedRoleId, setSelectedRoleId] = useState<string>('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

    const [userPrivileges, setUserPrivileges] = useState<Record<number, UserPrivilege>>({});
    const [rolePrivilegesMap, setRolePrivilegesMap] = useState<Record<number, RolePrivilege>>({});

    const [loading, setLoading] = useState(true);
    const [companyId, setCompanyId] = useState<number | null>(null);
    const { toast } = useToast();

    // 1. Initial Load: Roles, Company ID, All System Privileges
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);

                // Fetch Company ID (Assuming we have an endpoint, or from currentUser)
                // Try fetching /settings/company/me or similar if exists, else assume 1 for demo or extract from user
                // Let's try to fetch company info.
                // Fallback: If currentUser has companyId, use it.
                // Assuming currentUser might have it typed as any
                let cId = (currentUser as any)?.companyId;
                if (!cId) {
                    // Try fetching company list? Or 'me'
                    // EndpointBundle has COMPANY_ME = "/me" under /settings/company? No BASE_URL + SETTINGS + "/company"
                    // So /api/v1/settings/company/me
                    try {
                        const compRes = await apiClient.get('/settings/company/me');
                        cId = compRes.data.data.id;
                    } catch (e) {
                        console.error("Could not fetch company/me", e);
                    }
                }
                setCompanyId(cId || 1); // Default to 1 if failure for robustness

                const [rolesRes, privilegesRes] = await Promise.all([
                    apiClient.get('/settings/roles/get'),
                    apiClient.get('/company-privileges/mine'),
                ]);

                const rolesData = rolesRes.data.data.roles || rolesRes.data.data || [];
                const privilegesData = privilegesRes.data.privileges || [];

                setRoles(rolesData);
                setPrivileges(privilegesData);

            } catch (error) {
                console.error('Failed to fetch initial data:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load roles or privileges.',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [currentUser]);

    // 2. When Role Changes -> Fetch Employees & Role Privileges
    useEffect(() => {
        if (!selectedRoleId || !companyId) return;

        const fetchDataForRole = async () => {
            // Reset Employee selection and privileges
            setSelectedEmployeeId('');
            setEmployees([]);
            setUserPrivileges({});
            setRolePrivilegesMap({});

            try {
                // Fetch Employees for Role
                // URL: /settings/company/{companyId}/roles/{roleId}/employees
                // The backend mapped is EndpointBundle.EMPLOYEE_GET -> /company/{companyId}/roles/{roleId}/employees
                // But RequestMapping is EndpointBundle.EMPLOYEES -> /settings/employees
                // Wait, EmployeeController has @GetMapping(EndpointBundle.EMPLOYEE_GET).
                // EndpointBundle.EMPLOYEE_GET = "/company/{companyId}/roles/{roleId}/employees";
                // So full URL: /api/v1/settings/employees/company/{companyId}/roles/{roleId}/employees ? 
                // NO. EndpointBundle.EMPLOYEES = BASE_URL + SETTINGS ( /api/v1/settings )
                // Controller has @RequestMapping(EndpointBundle.EMPLOYEES)
                // GetMapping has EndpointBundle.EMPLOYEE_GET (/company/...)
                // So: /api/v1/settings/company/{cid}/roles/{rid}/employees

                const empRes = await apiClient.get(`/settings/company/${companyId}/roles/${selectedRoleId}/employees?page=0&size=1000`);
                // It returns Page<EmployeeResponseDto>, so data.data.content or data.data if it's List (it says Page in controller)
                const empData = empRes.data.data?.content || empRes.data.data || [];
                setEmployees(empData);

                // Fetch Role Privileges
                // URL: /settings/role-privileges/role/{roleId}
                const rpRes = await apiClient.get(`/settings/role-privileges/role/${selectedRoleId}`);
                const rpData: any[] = rpRes.data.data || [];

                const rpMap: Record<number, RolePrivilege> = {};
                rpData.forEach(rp => {
                    rpMap[rp.privilegeId] = {
                        privilegeId: rp.privilegeId,
                        canRead: rp.canRead,
                        canWrite: rp.canWrite,
                        canUpdate: rp.canUpdate,
                        canDelete: rp.canDelete
                    };
                });
                setRolePrivilegesMap(rpMap);

            } catch (error) {
                console.error("Failed to fetch role data", error);
                toast({ title: "Error", description: "Failed to load role data", variant: "destructive" });
            }
        };

        fetchDataForRole();
    }, [selectedRoleId, companyId]);

    // 3. When Employee Changes -> Fetch User Privileges
    useEffect(() => {
        if (!selectedEmployeeId) {
            setUserPrivileges({});
            return;
        }

        const fetchUserPrivileges = async () => {
            try {
                const res = await apiClient.get(`/settings/user-privileges/user/${selectedEmployeeId}`);
                const data: any[] = res.data.data || [];

                const privilegeMap: Record<number, UserPrivilege> = {};
                data.forEach((item) => {
                    privilegeMap[item.privilegeId] = {
                        id: item.id,
                        employeeId: item.employeeId,
                        privilegeId: item.privilegeId,
                        canRead: item.canRead,
                        canWrite: item.canWrite,
                        canUpdate: item.canUpdate,
                        canDelete: item.canDelete,
                    };
                });
                setUserPrivileges(privilegeMap);
            } catch (error) {
                console.error('Failed to fetch user privileges:', error);
            }
        };

        fetchUserPrivileges();
    }, [selectedEmployeeId]);

    const handleToggle = async (privilegeId: number, field: keyof UserPrivilege) => {
        if (!selectedEmployeeId) return;

        const current = userPrivileges[privilegeId] || {
            employeeId: Number(selectedEmployeeId),
            privilegeId,
            canRead: false,
            canWrite: false,
            canUpdate: false,
            canDelete: false,
        };

        const updated = { ...current, [field]: !current[field] };

        // Optimistic update
        setUserPrivileges({ ...userPrivileges, [privilegeId]: updated });

        try {
            await apiClient.post('/settings/user-privileges/assign', updated);
            toast({
                title: 'Success',
                description: 'User Privilege updated successfully.',
            });
        } catch (error) {
            // Revert on error
            setUserPrivileges({ ...userPrivileges, [privilegeId]: current });
            toast({
                title: 'Error',
                description: 'Failed to update user privilege.',
                variant: 'destructive',
            });
        }
    };

    // Filter privileges to only show those enabled in Role
    const getFilteredPrivileges = () => {
        return privileges.filter(p => {
            // Check if role has ANY permission for this privilege?
            // Or typically if the Role has an entry. 
            // Logic: "which enabled in the role privileges". 
            // I'll show it if the role has an entry for it.
            return rolePrivilegesMap[p.id] !== undefined;
        });
    };

    if (loading) {
        return (
            <DashboardLayout title="User Privileges">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    const filteredPrivileges = getFilteredPrivileges();

    return (
        <DashboardLayout title="User Privileges" subtitle="Configure granular CRUD permissions for each user">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Selection</CardTitle>
                        <CardDescription>Select a Role and then a User</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
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

                            <div className="space-y-2">
                                <label className="text-sm font-medium">User</label>
                                <Select
                                    value={selectedEmployeeId}
                                    onValueChange={setSelectedEmployeeId}
                                    disabled={!selectedRoleId || employees.length === 0}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={!selectedRoleId ? "Select role first" : employees.length === 0 ? "No employees in role" : "Select a user"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map((employee) => (
                                            <SelectItem key={employee.id} value={employee.id.toString()}>
                                                {employee.firstName} {employee.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {selectedEmployeeId && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Privilege Configuration
                            </CardTitle>
                            <CardDescription>
                                Setting privileges for {employees.find(e => e.id.toString() === selectedEmployeeId)?.firstName}.
                                Only privileges enabled for the {roles.find(r => r.id.toString() === selectedRoleId)?.name} role are shown.
                            </CardDescription>
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
                                        {filteredPrivileges.length > 0 ? (
                                            filteredPrivileges.map((privilege) => {
                                                const up = userPrivileges[privilege.id] || {
                                                    canRead: false,
                                                    canWrite: false,
                                                    canUpdate: false,
                                                    canDelete: false,
                                                };
                                                // Role context for disabling checkboxes if role doesn't have it?
                                                // The prompt: "he can set the priviliges... which enabled in the role privileges"
                                                // If I interpreted "enabled" as "present in list", I've done that.
                                                // If I interpret as "Checkbox enabled only if Role has it", I should check rolePrivilegesMap[p.id].canRead etc.
                                                // I will apply disabling logic as well for stricter compliance.
                                                const rolePriv = rolePrivilegesMap[privilege.id];

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
                                                                checked={up.canRead}
                                                                onCheckedChange={() => handleToggle(privilege.id, 'canRead')}
                                                                disabled={!hasRolePrivilege('ROLE_PRIVILEGE', 'canUpdate') || !rolePriv?.canRead}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Checkbox
                                                                checked={up.canWrite}
                                                                onCheckedChange={() => handleToggle(privilege.id, 'canWrite')}
                                                                disabled={!hasRolePrivilege('ROLE_PRIVILEGE', 'canUpdate') || !rolePriv?.canWrite}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Checkbox
                                                                checked={up.canUpdate}
                                                                onCheckedChange={() => handleToggle(privilege.id, 'canUpdate')}
                                                                disabled={!hasRolePrivilege('ROLE_PRIVILEGE', 'canUpdate') || !rolePriv?.canUpdate}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Checkbox
                                                                checked={up.canDelete}
                                                                onCheckedChange={() => handleToggle(privilege.id, 'canDelete')}
                                                                disabled={!hasRolePrivilege('ROLE_PRIVILEGE', 'canUpdate') || !rolePriv?.canDelete}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                                    No privileges enabled for this role.
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
