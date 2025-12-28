import React, { useState } from 'react';
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
import { useAuth } from '@/context/AuthContext';
import { companies } from '@/data/companies';
import { Info } from 'lucide-react';

interface RoleCCConfig {
    [roleKey: string]: string[]; // Role name -> Array of CC role names
}

interface NotificationConfig {
    companyId: string;
    primaryRecipient: string;
    roleCCConfigs: RoleCCConfig;
}

export const LeaveNotificationRules: React.FC = () => {
    const { roles } = useAuth();
    const { toast } = useToast();

    const [selectedCompany, setSelectedCompany] = useState<string>(companies[0]?.id || '');
    const [selectedCCRole, setSelectedCCRole] = useState<string>('');
    const [config, setConfig] = useState<NotificationConfig>({
        companyId: companies[0]?.id || '',
        primaryRecipient: '',
        roleCCConfigs: {},
    });

    // Get role names from the roles added by users
    const availableRoles = roles.map(role => role.name);

    // Set default selected CC role when roles are available
    React.useEffect(() => {
        if (availableRoles.length > 0 && !selectedCCRole) {
            setSelectedCCRole(availableRoles[0]);
        }
    }, [availableRoles, selectedCCRole]);

    const handlePrimaryRecipientChange = (value: string) => {
        setConfig(prev => ({
            ...prev,
            primaryRecipient: value,
        }));
    };

    const handleCCToggle = (ccRoleName: string, checked: boolean) => {
        setConfig(prev => {
            const currentCCs = prev.roleCCConfigs[selectedCCRole] || [];
            const updatedCCs = checked
                ? [...currentCCs, ccRoleName]
                : currentCCs.filter(r => r !== ccRoleName);

            return {
                ...prev,
                roleCCConfigs: {
                    ...prev.roleCCConfigs,
                    [selectedCCRole]: updatedCCs,
                },
            };
        });
    };

    const handleCompanyChange = (companyId: string) => {
        setSelectedCompany(companyId);
        setConfig(prev => ({
            ...prev,
            companyId,
        }));
    };

    const handleSaveConfiguration = () => {
        if (!config.primaryRecipient) {
            toast({
                title: 'Validation Error',
                description: 'Please select a primary recipient',
                variant: 'destructive',
            });
            return;
        }

        toast({
            title: 'Success',
            description: 'Leave notification configuration has been saved successfully.',
        });
    };

    const selectedCompanyData = companies.find(c => c.id === selectedCompany);
    const currentCCRoles = config.roleCCConfigs[selectedCCRole] || [];

    return (
        <DashboardLayout
            title="Leave Notification Configuration"
            subtitle="Configure who should receive leave application emails."
        >
            <div className="space-y-6 max-w-5xl">
                {/* Company Selector */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-4">
                        <Label htmlFor="company-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            Select Company:
                        </Label>
                        <Select value={selectedCompany} onValueChange={handleCompanyChange}>
                            <SelectTrigger className="w-64">
                                <SelectValue placeholder="Select a company" />
                            </SelectTrigger>
                            <SelectContent>
                                {companies.map(company => (
                                    <SelectItem key={company.id} value={company.id}>
                                        {company.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Main Configuration Card */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="grid md:grid-cols-2 gap-6 p-6">
                        {/* TO (Primary Recipient) Section */}
                        <div className="border-r border-gray-200 pr-6">
                            <h3 className="text-base font-semibold text-gray-900 mb-2">
                                TO (Primary Recipient)
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Select the primary recipient for leave requests:
                            </p>

                            <RadioGroup
                                value={config.primaryRecipient}
                                onValueChange={handlePrimaryRecipientChange}
                            >
                                <div className="space-y-3">
                                    {availableRoles.map(roleName => (
                                        <div key={roleName} className="flex items-center space-x-2">
                                            <RadioGroupItem value={roleName} id={`to-${roleName}`} />
                                            <Label
                                                htmlFor={`to-${roleName}`}
                                                className="text-sm font-normal cursor-pointer"
                                            >
                                                {roleName}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        </div>

                        {/* CC (Informational Recipients) Section */}
                        <div className="pl-6 md:pl-0">
                            <h3 className="text-base font-semibold text-gray-900 mb-2">
                                CC (Informational Recipients)
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                                Select additional recipients to be copied on leave requests:
                            </p>

                            {/* Role Selector for CC */}
                            <div className="mb-4">
                                <Label htmlFor="cc-role-select" className="text-sm font-medium text-gray-700 mb-2 block">
                                    Configure CC for role:
                                </Label>
                                <Select value={selectedCCRole} onValueChange={setSelectedCCRole}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableRoles.map(roleName => (
                                            <SelectItem key={roleName} value={roleName}>
                                                {roleName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* CC Role Checkboxes */}
                            {selectedCCRole && (
                                <div className="space-y-3">
                                    <p className="text-xs text-gray-500 mb-2">
                                        When <span className="font-semibold">{selectedCCRole}</span> requests leave, CC to:
                                    </p>
                                    {availableRoles
                                        .filter(roleName => roleName !== selectedCCRole)
                                        .map(roleName => (
                                            <div key={roleName} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`cc-${selectedCCRole}-${roleName}`}
                                                    checked={currentCCRoles.includes(roleName)}
                                                    onCheckedChange={(checked) =>
                                                        handleCCToggle(roleName, checked as boolean)
                                                    }
                                                />
                                                <Label
                                                    htmlFor={`cc-${selectedCCRole}-${roleName}`}
                                                    className="text-sm font-normal cursor-pointer"
                                                >
                                                    {roleName}
                                                </Label>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview Section */}
                    <div className="border-t border-gray-200 bg-gray-50 p-6">
                        <div className="flex items-start gap-2">
                            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Preview</h4>
                                <div className="text-sm text-gray-700 space-y-2">
                                    <p>
                                        <span className="font-medium">Primary Recipient:</span> {config.primaryRecipient || 'Not selected'}
                                    </p>
                                    <div>
                                        <p className="font-medium mb-1">CC Configuration by Role:</p>
                                        {Object.keys(config.roleCCConfigs).length > 0 ? (
                                            <ul className="list-disc list-inside space-y-1 ml-2">
                                                {Object.entries(config.roleCCConfigs).map(([role, ccs]) => (
                                                    ccs.length > 0 && (
                                                        <li key={role}>
                                                            <span className="font-medium">{role}:</span> {ccs.join(', ')}
                                                        </li>
                                                    )
                                                ))}
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
                        <Button
                            onClick={handleSaveConfiguration}
                            className="bg-blue-600 hover:bg-blue-700 px-8"
                        >
                            Save Configuration
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
