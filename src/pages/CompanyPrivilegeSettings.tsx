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
import { companies, Company } from '@/data/companies';
import { permissions, Permission } from '@/data/permissions';

// Type for tracking company privilege assignments
interface CompanyPrivilege {
    privilegeId: string;
    assigned: boolean;
}

interface CompanyPrivilegesMap {
    [companyId: string]: CompanyPrivilege[];
}

export const CompanyPrivilegeSettings: React.FC = () => {
    const [selectedCompany, setSelectedCompany] = useState<string>('');
    const [companyPrivileges, setCompanyPrivileges] = useState<CompanyPrivilegesMap>({});

    // Initialize company privileges on component mount
    useEffect(() => {
        const initialPrivileges: CompanyPrivilegesMap = {};
        companies.forEach((company) => {
            initialPrivileges[company.id] = permissions.map((privilege) => ({
                privilegeId: privilege.id,
                assigned: false,
            }));
        });
        setCompanyPrivileges(initialPrivileges);
        // Set first company as default
        if (companies.length > 0) {
            setSelectedCompany(companies[0].id);
        }
    }, []);

    // Get current company data
    const currentCompany = companies.find((c) => c.id === selectedCompany);
    const currentPrivileges = selectedCompany ? companyPrivileges[selectedCompany] || [] : [];

    // Handle privilege checkbox change
    const handlePrivilegeChange = (privilegeId: string, assigned: boolean) => {
        if (!selectedCompany) return;

        setCompanyPrivileges((prev) => ({
            ...prev,
            [selectedCompany]: prev[selectedCompany].map((priv) =>
                priv.privilegeId === privilegeId ? { ...priv, assigned } : priv
            ),
        }));
    };

    // Get privilege name by ID
    const getPrivilegeName = (privilegeId: string): string => {
        const privilege = permissions.find((p) => p.id === privilegeId);
        return privilege?.name || privilegeId;
    };

    return (
        <DashboardLayout>
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
                            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                                <SelectTrigger id="company-select" className="w-full sm:w-96">
                                    <SelectValue placeholder="Select a company" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map((company) => (
                                        <SelectItem key={company.id} value={company.id}>
                                            {company.name || company.companyName || 'Unnamed Company'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Privileges Table Card */}
                {currentCompany && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Privileges for {currentCompany.name || currentCompany.companyName}</CardTitle>
                            <CardDescription>
                                Manage which privileges are assigned to this company
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-muted/50">
                                            <TableHead className="w-3/4">Privilege Name</TableHead>
                                            <TableHead className="w-1/4 text-center">Assign</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentPrivileges.length > 0 ? (
                                            currentPrivileges.map((privilege) => (
                                                <TableRow key={privilege.privilegeId} className="hover:bg-muted/50">
                                                    <TableCell className="font-medium">
                                                        {getPrivilegeName(privilege.privilegeId)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Checkbox
                                                            checked={privilege.assigned}
                                                            onCheckedChange={(checked) =>
                                                                handlePrivilegeChange(
                                                                    privilege.privilegeId,
                                                                    checked as boolean
                                                                )
                                                            }
                                                            className="cursor-pointer"
                                                            aria-label={`Assign ${getPrivilegeName(privilege.privilegeId)}`}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                                                    No privileges available
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Summary Section */}
                            {currentPrivileges.length > 0 && (
                                <div className="mt-6 pt-6 border-t space-y-2">
                                    <div className="text-sm font-medium">Summary</div>
                                    <div className="text-sm text-muted-foreground">
                                        <span className="font-semibold text-foreground">
                                            {currentPrivileges.filter((p) => p.assigned).length}
                                        </span>
                                        {' '}of{' '}
                                        <span className="font-semibold text-foreground">
                                            {currentPrivileges.length}
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
