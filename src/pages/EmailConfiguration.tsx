import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { emailService, EmailConfigDTO } from '@/components/services/emailService';

export const EmailConfiguration: React.FC = () => {
    const [emailConfigs, setEmailConfigs] = useState<EmailConfigDTO[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState<EmailConfigDTO | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [enableCC, setEnableCC] = useState(false);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [ccEmailError, setCcEmailError] = useState('');

    // Initial form state
    const [formData, setFormData] = useState<EmailConfigDTO>({
        displayName: '',
        sentEmail: '',
        hostName: '',
        port: 587,
        protocol: 'SMTP',
        password: '',
        ccMailAddress: '',
    });

    // Fetch data on mount
    useEffect(() => {
        fetchEmailConfigs();
    }, []);

    const fetchEmailConfigs = async () => {
        setIsLoading(true);
        try {
            const response = await emailService.getAllEmail();
            const data = response.data || [];
            const configs = Array.isArray(data) ? data : [];
            setEmailConfigs(configs);
        } catch (error) {
            console.error("Failed to fetch email configs", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        if (emailConfigs.length > 0) {
            toast({
                title: 'Operation Not Allowed',
                description: 'You can only have one email configuration.',
                variant: 'destructive',
            });
            return;
        }

        setSelectedConfig(null);
        setFormData({
            displayName: '',
            sentEmail: '',
            hostName: '',
            port: 587,
            protocol: 'SMTP',
            password: '',
            ccMailAddress: '',
        });
        setEnableCC(false);
        setShowPassword(false);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (config: EmailConfigDTO) => {
        setSelectedConfig(config);
        setFormData({
            displayName: config.displayName,
            sentEmail: config.sentEmail,
            hostName: config.hostName,
            port: config.port,
            protocol: config.protocol,
            password: '', // Password not returned by backend, must be re-entered
            ccMailAddress: config.ccMailAddress || '',
        });
        setEnableCC(!!config.ccMailAddress);
        setShowPassword(false);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedConfig(null);
        setShowPassword(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError('');
        setCcEmailError('');

        // Email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Validate sentEmail
        if (!emailRegex.test(formData.sentEmail)) {
            setEmailError('Please enter a valid email address (e.g., user@example.com)');
            return;
        }

        // Validate CC email if enabled
        if (enableCC && formData.ccMailAddress && !emailRegex.test(formData.ccMailAddress)) {
            setCcEmailError('Please enter a valid CC email address (e.g., cc@example.com)');
            return;
        }

        const payload: EmailConfigDTO = {
            ...formData,
            ccMailAddress: enableCC ? formData.ccMailAddress : undefined,
        };

        try {
            if (selectedConfig && selectedConfig.id) {
                // Update
                await emailService.updateEmail(selectedConfig.id, payload);
                toast({
                    title: 'Configuration Updated',
                    description: 'Email configuration has been updated successfully.',
                });
            } else {
                // Add
                await emailService.addEmail(payload);
                toast({
                    title: 'Configuration Added',
                    description: 'New email configuration has been added successfully.',
                });
            }
            fetchEmailConfigs();
            handleCloseModal();
        } catch (error: any) {
            console.error("Operation failed", error);
            if (error.response) {
                console.error("Error Response Data:", error.response.data);
                console.error("Error Response Status:", error.response.status);
            }
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to save configuration. Please try again.',
                variant: 'destructive',
            });
        }
    };

    return (
        <DashboardLayout
            title="Email Configuration"
            subtitle="Configure email settings for system notifications"
        >
            <div className="space-y-6">
                {/* Email Configurations Section */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Email Configurations</h2>
                                <p className="text-sm text-gray-500 mt-1">Manage your SMTP server settings</p>
                            </div>
                            {/* Only show Add button if no configuration exists */}
                            {emailConfigs.length === 0 && (
                                <Button onClick={handleOpenAddModal} className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Configuration
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Display Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sent Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Hostname
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Port
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Protocol
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        CC Email
                                    </th>
                                    {/* Created At removed as it's not in the DTO explicitly, or we can add it if needed */}
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ACTIONS
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {emailConfigs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                            No configuration found.
                                        </td>
                                    </tr>
                                ) : (
                                    emailConfigs.map((config) => (
                                        <tr key={config.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {config.displayName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {config.sentEmail}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {config.hostName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {config.port}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                                    {config.protocol}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {config.ccMailAddress || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenEditModal(config)}
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add/Edit Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedConfig ? 'Edit Email Configuration' : 'Add Email Configuration'}
                            </DialogTitle>
                            <DialogDescription>
                                Enter SMTP server details to {selectedConfig ? 'update' : 'add a new'} email configuration
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="displayName">
                                        Display Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="displayName"
                                        placeholder="Leave Management System"
                                        value={formData.displayName}
                                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sentEmail">
                                        Sent Email <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="sentEmail"
                                        type="email"
                                        placeholder="noreply@company.com"
                                        value={formData.sentEmail}
                                        onChange={(e) => {
                                            setFormData({ ...formData, sentEmail: e.target.value });
                                            setEmailError('');
                                        }}
                                        required
                                        className={emailError ? 'border-red-500' : ''}
                                    />
                                    {emailError && (
                                        <p className="text-sm text-red-500 mt-1">{emailError}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hostName">
                                        Hostname <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="hostName"
                                        placeholder="smtp.gmail.com"
                                        value={formData.hostName}
                                        onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                                        required
                                        disabled={!!selectedConfig}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="port">
                                        Port <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="port"
                                        type="number"
                                        placeholder="587"
                                        value={formData.port}
                                        onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                                        required
                                        disabled={!!selectedConfig}
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="protocol">
                                        Protocol <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.protocol}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, protocol: value })
                                        }
                                        disabled={!!selectedConfig}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select protocol" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SMTP">SMTP</SelectItem>
                                            <SelectItem value="SMTPS">SMTPS</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="password">
                                        Password {selectedConfig && "(Re-enter required)"} <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="enableCC"
                                            checked={enableCC}
                                            onCheckedChange={(checked) => setEnableCC(checked as boolean)}
                                        />
                                        <Label htmlFor="enableCC" className="text-sm font-normal cursor-pointer">
                                            Enable CC (Carbon Copy) - Optional
                                        </Label>
                                    </div>
                                </div>
                                {enableCC && (
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="ccMailAddress">CC Email</Label>
                                        <Input
                                            id="ccMailAddress"
                                            type="email"
                                            placeholder="cc@company.com"
                                            value={formData.ccMailAddress || ''}
                                            onChange={(e) => {
                                                setFormData({ ...formData, ccMailAddress: e.target.value });
                                                setCcEmailError('');
                                            }}
                                            className={ccEmailError ? 'border-red-500' : ''}
                                        />
                                        {ccEmailError && (
                                            <p className="text-sm text-red-500 mt-1">{ccEmailError}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={handleCloseModal}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                    {selectedConfig ? 'Update' : 'Create'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};
