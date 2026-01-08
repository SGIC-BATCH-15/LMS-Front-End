import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { emailConfigurations as initialEmailConfigs, EmailConfiguration as EmailConfigurationType } from '@/data/emailConfig';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export const EmailConfiguration: React.FC = () => {
    const [emailConfigs, setEmailConfigs] = useState<EmailConfigurationType[]>(initialEmailConfigs);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState<EmailConfigurationType | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [enableCC, setEnableCC] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        displayName: '',
        sentEmail: '',
        hostname: '',
        port: 587,
        protocol: 'SMTP' as 'SMTP' | 'SMTPS',
        password: '',
        ccEmail: '',
    });

    const handleOpenAddModal = () => {
        setSelectedConfig(null);
        setFormData({
            displayName: '',
            sentEmail: '',
            hostname: '',
            port: 587,
            protocol: 'SMTP',
            password: '',
            ccEmail: '',
        });
        setEnableCC(false);
        setShowPassword(false);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (config: EmailConfigurationType) => {
        setSelectedConfig(config);
        setFormData({
            displayName: config.displayName,
            sentEmail: config.sentEmail,
            hostname: config.hostname,
            port: config.port,
            protocol: config.protocol,
            password: config.password,
            ccEmail: config.ccEmail || '',
        });
        setEnableCC(!!config.ccEmail);
        setShowPassword(false);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedConfig(null);
        setShowPassword(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedConfig) {
            // Update existing configuration
            setEmailConfigs(prev =>
                prev.map(config =>
                    config.id === selectedConfig.id
                        ? {
                            ...config,
                            ...formData,
                            ccEmail: enableCC ? formData.ccEmail : undefined,
                        }
                        : config
                )
            );
            toast({
                title: 'Configuration Updated',
                description: 'Email configuration has been updated successfully.',
            });
        } else {
            // Add new configuration
            const newConfig: EmailConfigurationType = {
                id: String(Date.now()),
                ...formData,
                ccEmail: enableCC ? formData.ccEmail : undefined,
                createdAt: new Date(),
            };
            setEmailConfigs(prev => [...prev, newConfig]);
            toast({
                title: 'Configuration Added',
                description: 'New email configuration has been added successfully.',
            });
        }

        handleCloseModal();
    };

    const handleDelete = (config: EmailConfigurationType) => {
        setSelectedConfig(config);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (selectedConfig) {
            setEmailConfigs(prev => prev.filter(config => config.id !== selectedConfig.id));
            toast({
                title: 'Configuration Deleted',
                description: 'Email configuration has been deleted successfully.',
                variant: 'destructive',
            });
        }
        setIsDeleteDialogOpen(false);
        setSelectedConfig(null);
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
                            <Button onClick={handleOpenAddModal}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Configuration
                            </Button>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ACTIONS
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {emailConfigs.map((config) => (
                                    <tr key={config.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {config.displayName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {config.sentEmail}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {config.hostname}
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
                                            {config.ccEmail || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {format(new Date(config.createdAt), 'MMM dd, yyyy')}
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
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(config)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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
                                        onChange={(e) => setFormData({ ...formData, sentEmail: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hostname">
                                        Hostname <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="hostname"
                                        placeholder="smtp.gmail.com"
                                        value={formData.hostname}
                                        onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                                        required
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
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="protocol">
                                        Protocol <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.protocol}
                                        onValueChange={(value: 'SMTP' | 'SMTPS') =>
                                            setFormData({ ...formData, protocol: value })
                                        }
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
                                        Password <span className="text-red-500">*</span>
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
                                        <Label htmlFor="ccEmail">CC Email</Label>
                                        <Input
                                            id="ccEmail"
                                            type="email"
                                            placeholder="cc@company.com"
                                            value={formData.ccEmail}
                                            onChange={(e) => setFormData({ ...formData, ccEmail: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={handleCloseModal}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {selectedConfig ? 'Update' : 'Create'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Email Configuration</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete this email configuration? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDelete}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
};
