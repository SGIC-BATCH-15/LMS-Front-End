import React, { useState } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { departments as initialDepartments } from '@/data/mockData';
import { companies } from '@/data/companies';
import { Department } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

export const Departments: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>(initialDepartments);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [formData, setFormData] = useState({ name: '', companyId: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const { toast } = useToast();

    const filteredDepartments = departments.filter(dept =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredDepartments.slice(indexOfFirstItem, indexOfLastItem);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleOpenDialog = (dept?: Department) => {
        if (dept) {
            setEditingDept(dept);
            setFormData({
                name: dept.name,
                companyId: (dept as any).companyId || ''
            });
        } else {
            setEditingDept(null);
            setFormData({ name: '', companyId: '' });
        }
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (!formData.name || !formData.companyId) {
            toast({
                title: 'Error',
                description: 'Please fill in all fields',
                variant: 'destructive',
            });
            return;
        }

        if (editingDept) {
            setDepartments(departments.map(d =>
                d.id === editingDept.id ? { ...d, ...formData } : d
            ));
            toast({
                title: 'Success',
                description: 'Department updated successfully',
            });
        } else {
            const newDept: Department = {
                id: `dept-${Date.now()}`,
                ...formData,
            };
            setDepartments([...departments, newDept]);
            toast({
                title: 'Success',
                description: 'Department created successfully',
            });
        }
        setIsDialogOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this department?')) {
            setDepartments(departments.filter(d => d.id !== id));
            toast({
                title: 'Success',
                description: 'Department deleted successfully',
            });
        }
    };



    return (
        <DashboardLayout title="Departments" subtitle="Manage organizational departments">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search departments..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => handleOpenDialog()}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Department
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingDept ? 'Edit Department' : 'Add New Department'}</DialogTitle>
                                <DialogDescription>
                                    {editingDept ? 'Update department information' : 'Create a new department'}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="company">Company</Label>
                                    <Select
                                        value={formData.companyId}
                                        onValueChange={(value) => setFormData({ ...formData, companyId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a company" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {companies.map((company) => (
                                                <SelectItem key={company.id} value={company.id}>
                                                    {company.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Department Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Engineering"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSave}>
                                    {editingDept ? 'Update' : 'Create'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            All Departments
                        </CardTitle>
                        <CardDescription>
                            View and manage all departments in the organization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Department Name</TableHead>

                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentItems.map((dept) => (
                                    <TableRow key={dept.id}>
                                        <TableCell className="font-medium">{dept.name}</TableCell>

                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDialog(dept)}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(dept.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

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
            </div>
        </DashboardLayout>
    );
};
