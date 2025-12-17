import React, { useState } from 'react';
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
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Company as CompanyType, companies as initialCompanies } from '@/data/companies';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

export const Company: React.FC = () => {
    const [companies, setCompanies] = useState<CompanyType[]>(initialCompanies);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<CompanyType | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        email: '',
        phoneNumber: '',
    });

    // Filter and Pagination Logic
    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredCompanies.slice(indexOfFirstItem, indexOfLastItem);

    // Reset to page 1 when search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

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

    const handleSave = () => {
        if (!formData.name || !formData.address || !formData.email || !formData.phoneNumber) {
            toast.error('Please fill in all fields');
            return;
        }

        if (editingCompany) {
            // Update existing company
            setCompanies(companies.map(c =>
                c.id === editingCompany.id
                    ? { ...c, ...formData }
                    : c
            ));
            toast.success('Company updated successfully');
        } else {
            // Add new company
            const newCompany: CompanyType = {
                id: Date.now().toString(),
                ...formData,
            };
            setCompanies([...companies, newCompany]);
            toast.success('Company added successfully');
        }

        handleCloseDialog();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this company?')) {
            setCompanies(companies.filter(c => c.id !== id));
            toast.success('Company deleted successfully');
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
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Company
                        </Button>
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
                            {currentItems.length === 0 ? (
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
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenDialog(company)}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(company.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
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
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                            </PaginationItem>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        isActive={page === currentPage}
                                        onClick={() => setCurrentPage(page)}
                                        className="cursor-pointer"
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
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
                            <Button variant="outline" onClick={handleCloseDialog}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave}>
                                {editingCompany ? 'Update' : 'Add'} Company
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};
