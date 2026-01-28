import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Company as CompanyType } from '@/data/companies';
import { addCompany, getAllCompanies, updateCompany, deleteCompany, searchCompanies } from '@/components/services/companyService';
import { useRolePrivilege } from '@/context/RolePrivilegeContext';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

export const Company: React.FC = () => {
    const { hasRolePrivilege } = useRolePrivilege();
    const [companies, setCompanies] = useState<CompanyType[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<CompanyType | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const itemsPerPage = 5;

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        email: '',
        phoneNumber: '',
    });

    // Filter and Pagination Logic
    const filteredCompanies = companies;

    const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredCompanies.slice(indexOfFirstItem, indexOfLastItem);

    // Fetch companies on component mount
    // Reset to page 1 when search changes and fetch results
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setCurrentPage(1);
            fetchCompanies(searchTerm);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const fetchCompanies = async (query: string = '') => {
        try {
            setIsFetching(true);
            const data = query ? await searchCompanies(query) : await getAllCompanies();
            setCompanies(data);
        } catch (error: any) {
            console.error('Failed to fetch companies:', error);
            toast.error(error?.response?.data?.message || 'Failed to fetch companies');
        } finally {
            setIsFetching(false);
        }
    };

    const handleOpenDialog = (company?: CompanyType) => {
        if (company) {
            setEditingCompany(company);
            setFormData({
                name: company.name,
                address: company.address,
                email: company.email,
                phoneNumber: company.phoneNumber,
            });
        } else {
            setEditingCompany(null);
            setFormData({
                name: '',
                address: '',
                email: '',
                phoneNumber: '',
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingCompany(null);
        setFormData({
            name: '',
            address: '',
            email: '',
            phoneNumber: '',
        });
    };

    const handleSave = async () => {
        if (!formData.name || !formData.address || !formData.email || !formData.phoneNumber) {
            toast.error('Please fill in all fields');
            return;
        }

        // Validate company name (only letters and spaces allowed)
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!nameRegex.test(formData.name)) {
            toast.error('Company name can only contain letters and spaces (no numbers or symbols).');
            return;
        }


        try {
            setIsLoading(true);

            console.log('Sending company data:', formData);

            if (editingCompany) {
                // Check if any field has changed
                const hasChanges =
                    formData.name !== editingCompany.name ||
                    formData.address !== editingCompany.address ||
                    formData.email !== editingCompany.email ||
                    formData.phoneNumber !== editingCompany.phoneNumber;

                if (!hasChanges) {
                    toast.info('No changes detected.');
                    return;
                }

                // Update existing company
                await updateCompany(editingCompany.id, formData);
                toast.success('Company updated successfully');
            } else {
                // Add new company
                await addCompany(formData);
                toast.success('Company added successfully');
            }

            // Refresh the companies list
            await fetchCompanies();
            handleCloseDialog();
        } catch (error: any) {
            console.error('Failed to save company:', error);

            let errorMessage = 'Failed to save company';

            if (error?.response?.data) {
                const data = error.response.data;
                // Check for statusMessage first (common in this backend)
                if (data.statusMessage) {
                    errorMessage = data.statusMessage;
                } else if (data.message) {
                    errorMessage = data.message;
                } else if (data.error) {
                    errorMessage = data.error;
                } else if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                    // Handle validation errors in data array
                    errorMessage = data.data.map((err: any) =>
                        typeof err === 'string' ? err : err.message || JSON.stringify(err)
                    ).join('. ');
                }
            } else if (error?.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this company?\n\n' +
            'Note: Companies with linked records (employees, departments, etc.) cannot be deleted. ' +
            'You must first remove or reassign all related records.'
        );

        if (confirmed) {
            try {
                console.log('Attempting to delete company with ID:', id);
                await deleteCompany(id);
                toast.success('Company deleted successfully');
                // Refresh the companies list
                await fetchCompanies();
            } catch (error: any) {
                console.error('Failed to delete company:', error);
                console.error('Delete error response:', error?.response);
                console.error('Delete error data:', error?.response?.data);

                // Improved error extraction for delete
                const responseData = error?.response?.data;
                const backendMessage = responseData?.statusMessage
                    || responseData?.message
                    || responseData?.error
                    || error?.message
                    || 'Failed to delete company';

                let userMessage = backendMessage;

                if (backendMessage?.toLowerCase().includes('linked') ||
                    backendMessage?.toLowerCase().includes('related')) {
                    userMessage = 'Cannot delete this company because it has related records (employees, departments, leave requests, etc.). Please remove or reassign all related records first, then try again.';
                } else {
                    userMessage = backendMessage || 'Failed to delete company';
                }

                toast.error(userMessage, { duration: 6000 });
            }
        }
    };

    return (
        <DashboardLayout
            title="Company Management"
            subtitle="Manage company information and settings"
        >
            <div className="space-y-6">
                {/* Header with Add Button */}
                {/* Header and Search */}
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Companies</h2>
                            <p className="text-muted-foreground">
                                Manage your company details and credentials
                            </p>
                        </div>
                        {hasRolePrivilege('MANAGE_COMPANY', 'canWrite') && (
                            <Button onClick={() => handleOpenDialog()}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Company
                            </Button>
                        )}
                    </div>

                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search companies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Companies Table */}
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Company Name</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone Number</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isFetching ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Loading companies...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : currentItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No companies found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentItems.map((company) => (
                                    <TableRow key={company.id}>
                                        <TableCell className="font-medium">{company.name}</TableCell>
                                        <TableCell>{company.address}</TableCell>
                                        <TableCell>{company.email}</TableCell>
                                        <TableCell>{company.phoneNumber}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {hasRolePrivilege('MANAGE_COMPANY', 'canUpdate') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenDialog(company)}
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {hasRolePrivilege('MANAGE_COMPANY', 'canDelete') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(company.id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                            Total Companies: {filteredCompanies.length}
                        </div>
                        <Pagination className="w-auto mx-0">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    />
                                </PaginationItem>

                                {/* Page numbers removed as requested */}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}

                {/* Add/Edit Company Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[525px]">
                        <DialogHeader>
                            <DialogTitle>
                                {editingCompany ? 'Edit Company' : 'Add Company'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingCompany
                                    ? 'Update company information below'
                                    : 'Enter company details to add a new company'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Company Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter company name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">
                                    Address <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Enter company address"
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Email <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="company@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber">
                                    Phone Number <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleCloseDialog} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {editingCompany ? 'Updating...' : 'Adding...'}
                                    </>
                                ) : (
                                    <>{editingCompany ? 'Update' : 'Add'} Company</>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};
