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

import { emailConfigurations as initialEmailConfigs, EmailConfiguration as EmailConfigurationType } from '@/data/emailConfig';
import { useToast } from '@/hooks/use-toast';
import { emailService, EmailConfigDTO } from '@/components/services/emailService';

export const EmailConfiguration: React.FC = () => {
    const [emailConfigs, setEmailConfigs] = useState<EmailConfigurationType[]>(initialEmailConfigs);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState<EmailConfigurationType | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [enableCC, setEnableCC] = useState(false);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState<EmailConfigDTO>({
        displayName: '',
        sentEmail: '',
        hostName: '',
        port: 587,
        protocol: 'SMTP',
        password: '',
        ccMailAddress: '',
    });

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

    const handleOpenEditModal = (config: EmailConfigurationType) => {
        setSelectedConfig(config);
        setFormData({
            displayName: config.displayName,
            sentEmail: config.sentEmail,
            hostName: config.hostName,
            port: config.port,
            protocol: config.protocol,
            password: '',
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

        const payload: EmailConfigDTO = {
            ...formData,
            ccMailAddress: enableCC ? formData.ccMailAddress : undefined,
        };

        try {
            if (selectedConfig && selectedConfig.id) {
                await emailService.updateEmail(selectedConfig.id, payload);
                toast({
                    title: 'Configuration Updated',
                    description: 'Email configuration has been updated successfully.',
                });
            } else {
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
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-6 border-b border-gray-200 flex justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Email Configurations</h2>
                            <p className="text-sm text-gray-500">Manage SMTP server settings</p>
                        </div>
                        {emailConfigs.length === 0 && (
                            <Button onClick={handleOpenAddModal}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Configuration
                            </Button>
                        )}
                    </div>

                    <table className="w-full">
                        <thead>
                            <tr>
                                <th>Display Name</th>
                                <th>Sent Email</th>
                                <th>Hostname</th>
                                <th>Port</th>
                                <th>Protocol</th>
                                <th>CC Email</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {emailConfigs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center">No configuration found.</td>
                                </tr>
                            ) : (
                                emailConfigs.map(config => (
                                    <tr key={config.id}>
                                        <td>{config.displayName}</td>
                                        <td>{config.sentEmail}</td>
                                        <td>{config.hostName}</td>
                                        <td>{config.port}</td>
                                        <td>
                                            <Badge>{config.protocol}</Badge>
                                        </td>
                                        <td>{config.ccMailAddress || '-'}</td>
                                        <td className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenEditModal(config)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {selectedConfig ? 'Edit Email Configuration' : 'Add Email Configuration'}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit}>
                            {/* form unchanged */}
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};
