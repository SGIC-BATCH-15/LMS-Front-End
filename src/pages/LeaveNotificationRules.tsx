import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRolePrivilege } from '@/context/RolePrivilegeContext';
import { Info } from 'lucide-react';
import { getAllCompanies, CompanyResponse } from '@/components/services/companyService';
import { roleService, Role } from '@/components/services/roleService';
import apiClient from '@/components/services/apiClient'; // Your axios instance with JWT interceptor

interface CcConfiguration {
    forRoleId: number;
    ccRoleIds: number[];
}

interface NotificationConfig {
    companyId: string;
    primaryRecipient: string;
    roleCCConfigs: { [roleName: string]: string[] };
}

export const LeaveNotificationRules: React.FC = () => {
    const { hasRolePrivilege } = useRolePrivilege();
    const { toast } = useToast();

    const [companies, setCompanies] = useState<CompanyResponse[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCompany, setSelectedCompany] = useState<string>('');
    const [selectedCCRole, setSelectedCCRole] = useState<string>('');
    const [config, setConfig] = useState<NotificationConfig>({
        companyId: '',
        primaryRecipient: '',
        roleCCConfigs: {},
    });

    // Fetch companies + roles
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [companyData, roleData] = await Promise.all([
                    getAllCompanies(),
                    roleService.getAllRoles(),
                ]);

                setCompanies(companyData);
                setRoles(roleData);

                if (companyData.length > 0) {
                    const firstId = companyData[0].id;
                    setSelectedCompany(firstId);
                    setConfig(prev => ({ ...prev, companyId: firstId }));
                }

                if (roleData.length > 0) {
                    setSelectedCCRole(roleData[0].name);
                }
            } catch (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to load companies or roles.',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [toast]);

    const handlePrimaryRecipientChange = (value: string) => {
        setConfig(prev => ({ ...prev, primaryRecipient: value }));
    };

    const handleCCToggle = (ccRoleName: string, checked: boolean) => {
        setConfig(prev => {
            const current = prev.roleCCConfigs[selectedCCRole] || [];
            const updated = checked
                ? [...current, ccRoleName]
                : current.filter(r => r !== ccRoleName);

            return {
                ...prev,
                roleCCConfigs: { ...prev.roleCCConfigs, [selectedCCRole]: updated },
            };
        });
    };

    const handleCompanyChange = (companyId: string) => {
        setSelectedCompany(companyId);
        setConfig(prev => ({ ...prev, companyId }));
    };

    const handleSaveConfiguration = async () => {
        if (!config.primaryRecipient) {
            toast({
                title: 'Validation Error',
                description: 'Please select a primary recipient',
                variant: 'destructive',
            });
            return;
        }

        try {
            // Role name → ID map
            const roleNameToId = new Map<string, number>();
            roles.forEach(role => roleNameToId.set(role.name, role.id));

            const toRoleId = roleNameToId.get(config.primaryRecipient);
            if (!toRoleId) throw new Error('Primary role not found');

            // Build ccConfigurations
            const ccConfigurations: CcConfiguration[] = Object.entries(config.roleCCConfigs)
                .filter(([, ccs]) => ccs.length > 0)
                .map(([forRoleName, ccNames]) => {
                    const forRoleId = roleNameToId.get(forRoleName);
                    if (!forRoleId) throw new Error(`For role not found: ${forRoleName}`);

                    const ccRoleIds = ccNames.map(name => {
                        const id = roleNameToId.get(name);
                        if (!id) throw new Error(`CC role not found: ${name}`);
                        return id;
                    });

                    return { forRoleId, ccRoleIds };
                });

            const payload = {
                companyId: parseInt(config.companyId),
                toRoleId,
                ccConfigurations,
            };

            // Real API call using your apiClient (with JWT)
            const response = await apiClient.post(
                '/leavemanagement/notification-config/add',
                payload
            );

            // Success toast
            toast({
                title: 'Success',
                description: response.data?.message || 'Configuration saved successfully!',
            });
        } catch (error: any) {
            let message = 'Failed to save configuration. Please try again.';

            if (error.response) {
                // Extract backend message from ResponseWrapper
                message = error.response.data?.message
                    || error.response.data?.error
                    || `Server error: ${error.response.status}`;
            } else if (error.request) {
                message = 'No response from server. Check network or backend.';
            }

            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
            console.error('Save error:', error);
        }
    };

    const currentCCRoles = config.roleCCConfigs[selectedCCRole] || [];

    if (loading) {
        return (
            <DashboardLayout title="Leave Notification Configuration" subtitle="...">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (companies.length === 0 || roles.length === 0) {
        return (
            <DashboardLayout title="Leave Notification Configuration" subtitle="...">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">No data available. Add companies/roles first.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="Leave Notification Configuration"
            subtitle="Configure who should receive leave application emails."
        >
            <div className="space-y-6 max-w-5xl">
                {/* Company Selector */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-4">
                        <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            Select Company:
                        </Label>
                        <Select value={selectedCompany} onValueChange={handleCompanyChange} disabled>
                            <SelectTrigger className="w-64">
                                <SelectValue placeholder="Select a company" />
                            </SelectTrigger>
                            <SelectContent>
                                {companies.map(c => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Main Card - TO + CC + Preview + Save */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="grid md:grid-cols-2 gap-6 p-6">
                        {/* TO Section */}
                        <div className="border-r border-gray-200 pr-6">
                            <h3 className="text-base font-semibold mb-2">TO (Primary Recipient)</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Select the primary recipient for leave requests:
                            </p>
                            <RadioGroup value={config.primaryRecipient} onValueChange={handlePrimaryRecipientChange}>
                                <div className="space-y-3">
                                    {roles.map(role => (
                                        <div key={role.id} className="flex items-center space-x-2">
                                            <RadioGroupItem value={role.name} id={`to-${role.name}`} />
                                            <Label htmlFor={`to-${role.name}`}>{role.name}</Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        </div>

                        {/* CC Section */}
                        <div className="pl-6 md:pl-0">
                            <h3 className="text-base font-semibold mb-2">CC (Informational Recipients)</h3>
                            <p className="text-sm text-gray-600 mb-2">
                                Select additional recipients:
                            </p>
                            <div className="mb-4">
                                <Label className="text-sm font-medium mb-2 block">
                                    Configure CC for role:
                                </Label>
                                <Select value={selectedCCRole} onValueChange={setSelectedCCRole}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map(role => (
                                            <SelectItem key={role.id} value={role.name}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedCCRole && (
                                <div className="space-y-3">
                                    <p className="text-xs text-gray-500 mb-2">
                                        When <span className="font-semibold">{selectedCCRole}</span> requests leave, CC to:
                                    </p>
                                    {roles
                                        .filter(r => r.name !== selectedCCRole)
                                        .map(role => (
                                            <div key={role.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`cc-${selectedCCRole}-${role.name}`}
                                                    checked={currentCCRoles.includes(role.name)}
                                                    onCheckedChange={checked =>
                                                        handleCCToggle(role.name, checked as boolean)
                                                    }
                                                />
                                                <Label htmlFor={`cc-${selectedCCRole}-${role.name}`}>
                                                    {role.name}
                                                </Label>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="border-t border-gray-200 bg-gray-50 p-6">
                        <div className="flex items-start gap-2">
                            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold mb-2">Preview</h4>
                                <div className="text-sm text-gray-700 space-y-2">
                                    <p>
                                        <span className="font-medium">Primary Recipient:</span>{' '}
                                        {config.primaryRecipient || 'Not selected'}
                                    </p>
                                    <div>
                                        <p className="font-medium mb-1">CC Configuration by Role:</p>
                                        {Object.keys(config.roleCCConfigs).length > 0 ? (
                                            <ul className="list-disc list-inside space-y-1 ml-2">
                                                {Object.entries(config.roleCCConfigs).map(([role, ccs]) =>
                                                    ccs.length > 0 && (
                                                        <li key={role}>
                                                            <span className="font-medium">{role}:</span>{' '}
                                                            {ccs.join(', ')}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        ) : (
                                            <p className="text-gray-500 ml-2">No CC configurations set</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="border-t border-gray-200 p-6 flex justify-center">
                        {hasRolePrivilege('MANAGE_LEAVE_NOTIFICATION_RULES', 'canWrite') && (
                            <Button
                                onClick={handleSaveConfiguration}
                                className="bg-blue-600 hover:bg-blue-700 px-8"
                            >
                                Save Configuration
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};