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
import { toast } from 'sonner';

import { getAllCompanies, CompanyResponse } from '@/components/services/companyService';
import { getAllPrivileges, PrivilegeDTO } from '@/components/services/privilegeService';
import {
    getCompanyPrivileges,
    assignPrivilegesToCompany,
    removePrivilegeFromCompany
} from '@/components/services/CompanyPrivilegeService';
import { useRolePrivilege } from '@/context/RolePrivilegeContext';

export const CompanyPrivilegeSettings: React.FC = () => {
    const { hasRolePrivilege } = useRolePrivilege();
    const [companies, setCompanies] = useState<CompanyResponse[]>([]);
    const [allPrivileges, setAllPrivileges] = useState<PrivilegeDTO[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [assignedPrivilegeCodes, setAssignedPrivilegeCodes] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    // Fetch initial data (Companies and System Privileges)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [companiesData, privilegesData] = await Promise.all([
                    getAllCompanies(),
                    getAllPrivileges()
                ]);
                setCompanies(companiesData);
                setAllPrivileges(privilegesData);

                if (companiesData.length > 0) {
                    setSelectedCompanyId(companiesData[0].id.toString());
                }
            } catch (error) {
                console.error("Failed to fetch initial data", error);
                toast.error("Failed to load companies or privileges");
            }
        };

        fetchInitialData();
    }, []);

    // Fetch company-specific privileges when selected company changes
    useEffect(() => {
        if (!selectedCompanyId) return;

        const fetchCompanyPrivileges = async () => {
            setIsLoading(true);
            try {
                // companyId might be string from select, verify if service expects number
                const companyIdNum = parseInt(selectedCompanyId);
                const response = await getCompanyPrivileges(companyIdNum);

                const codes = new Set(response.privileges.map(p => p.code));
                setAssignedPrivilegeCodes(codes);
            } catch (error) {
                console.error("Failed to fetch company privileges", error);
                toast.error("Failed to load company privileges");
                setAssignedPrivilegeCodes(new Set());
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompanyPrivileges();
    }, [selectedCompanyId]);

    // Handle privilege checkbox change
    const handlePrivilegeChange = async (privilegeCode: string, isChecked: boolean) => {
        if (!selectedCompanyId) return;

        const companyIdNum = parseInt(selectedCompanyId);
        // Optimistic update
        const prevCodes = new Set(assignedPrivilegeCodes);
        const newCodes = new Set(prevCodes);
        if (isChecked) {
            newCodes.add(privilegeCode);
        } else {
            newCodes.delete(privilegeCode);
        }
        setAssignedPrivilegeCodes(newCodes);

        try {
            if (isChecked) {
                await assignPrivilegesToCompany(companyIdNum, [privilegeCode]);
                toast.success("Privilege assigned successfully");
            } else {
                await removePrivilegeFromCompany(companyIdNum, privilegeCode);
                toast.success("Privilege removed successfully");
            }
        } catch (error) {
            console.error("Failed to update privilege", error);
            toast.error("Failed to update privilege");
            setAssignedPrivilegeCodes(prevCodes); // Revert on failure
        }
    };

    const currentCompany = companies.find((c) => c.id.toString() === selectedCompanyId);

    return (
        <DashboardLayout title="Company Privilege Settings" showApplyButton={false}>
            <div className="space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Company Privilege Settings</h1>
                    <p className="text-muted-foreground">
                        Configure privileges for each company
                    </p>
                </div>

                {/* Company Selection Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Select Company</CardTitle>
                        <CardDescription>
                            Choose a company to manage its privileges
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="company-select" className="text-sm font-medium">
                                Company
                            </Label>
                            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                                <SelectTrigger id="company-select" className="w-full sm:w-96">
                                    <SelectValue placeholder="Select a company" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map((company) => (
                                        <SelectItem key={company.id} value={company.id.toString()}>
                                            {company.name || 'Unnamed Company'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Privileges Table Card */}
                {selectedCompanyId && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Privileges for {currentCompany?.name}</CardTitle>
                            <CardDescription>
                                Manage which privileges are assigned to this company
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="text-center py-4">Loading privileges...</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-muted/50">
                                                <TableHead className="w-1/4">Code</TableHead>
                                                <TableHead className="w-1/2">Description</TableHead>
                                                <TableHead className="w-1/4 text-center">Assign</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {allPrivileges.length > 0 ? (
                                                allPrivileges.map((privilege) => (
                                                    <TableRow key={privilege.id} className="hover:bg-muted/50">
                                                        <TableCell className="font-mono text-xs">
                                                            {privilege.code}
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {privilege.description || privilege.name}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Checkbox
                                                                checked={assignedPrivilegeCodes.has(privilege.code)}
                                                                onCheckedChange={(checked) =>
                                                                    handlePrivilegeChange(
                                                                        privilege.code,
                                                                        checked as boolean
                                                                    )
                                                                }
                                                                className="cursor-pointer"
                                                                aria-label={`Assign ${privilege.name}`}
                                                                disabled={!hasRolePrivilege('COMPANY_PRIVILEGE', 'canUpdate')}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                                        No system privileges found. Please contact an administrator.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {/* Summary Section */}
                            {!isLoading && allPrivileges.length > 0 && (
                                <div className="mt-6 pt-6 border-t space-y-2">
                                    <div className="text-sm font-medium">Summary</div>
                                    <div className="text-sm text-muted-foreground">
                                        <span className="font-semibold text-foreground">
                                            {assignedPrivilegeCodes.size}
                                        </span>
                                        {' '}of{' '}
                                        <span className="font-semibold text-foreground">
                                            {allPrivileges.length}
                                        </span>
                                        {' '}privileges assigned
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};
