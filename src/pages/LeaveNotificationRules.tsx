import React, { useState } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
    NotificationRule,
    initialNotificationRules,
    availableRoles,
    Role,
} from '@/data/notificationRules';

export const LeaveNotificationRules: React.FC = () => {
    const [rules, setRules] = useState<NotificationRule[]>(initialNotificationRules);
    const [originalRules] = useState<NotificationRule[]>(initialNotificationRules);
    const { toast } = useToast();

    const handleCheckboxChange = (requesterRole: Role, ccRole: Role, checked: boolean) => {
        setRules(prevRules =>
            prevRules.map(rule => {
                if (rule.requesterRole === requesterRole) {
                    const updatedAllowedRoles = checked
                        ? [...rule.allowedCCRoles, ccRole]
                        : rule.allowedCCRoles.filter(role => role !== ccRole);
                    return { ...rule, allowedCCRoles: updatedAllowedRoles };
                }
                return rule;
            })
        );
    };

    const isRoleAllowed = (requesterRole: Role, ccRole: Role): boolean => {
        const rule = rules.find(r => r.requesterRole === requesterRole);
        return rule ? rule.allowedCCRoles.includes(ccRole) : false;
    };

    const handleSave = () => {
        toast({
            title: 'Success',
            description: 'Notification rules have been saved successfully.',
        });
    };

    const handleReset = () => {
        setRules(originalRules);
        toast({
            title: 'Reset',
            description: 'All changes have been reset to original values.',
        });
    };

    return (
        <DashboardLayout
            title="Leave Notification Rules"
            subtitle="Configure CC permissions for leave requests"
        >
            <div className="space-y-6">
                {/* Notification Rules Card */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Notification Rules</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Configure which roles can be selected as CC (Carbon Copy) when employees apply for leave
                        </p>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        REQUESTER ROLE
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ALLOWED CC ROLES
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {rules.map((rule) => (
                                    <tr key={rule.requesterRole} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {rule.requesterRole}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap items-center gap-8">
                                                {availableRoles
                                                    .filter(role => role !== rule.requesterRole)
                                                    .map((ccRole) => (
                                                        <div key={ccRole} className="flex items-center space-x-2 min-w-[140px]">
                                                            <Checkbox
                                                                id={`${rule.requesterRole}-${ccRole}`}
                                                                checked={isRoleAllowed(rule.requesterRole, ccRole)}
                                                                onCheckedChange={(checked) =>
                                                                    handleCheckboxChange(rule.requesterRole, ccRole, checked as boolean)
                                                                }
                                                            />
                                                            <label
                                                                htmlFor={`${rule.requesterRole}-${ccRole}`}
                                                                className="text-sm text-gray-700 cursor-pointer"
                                                            >
                                                                {ccRole}
                                                            </label>
                                                        </div>
                                                    ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={handleReset}>
                                Reset
                            </Button>
                            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
