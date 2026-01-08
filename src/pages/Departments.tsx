import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Department } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { departmentService, Company } from '@/components/services/departmentService';
import { useAuth } from '@/context/AuthContext';



export const Departments: React.FC = () => {
    const { currentUser } = useAuth();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [formData, setFormData] = useState({ name: '', companyId: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const { toast } = useToast();

    // Fetch Companies
    const fetchCompanies = async () => {
        try {
            const data = await departmentService.getAllCompanies();
            // Backend returns Page, we need content
            const content = data.content || [];
            // Filter to only show company with ID 1
            const filteredCompanies = content.filter((company: Company) => company.id.toString() === '1');
            setCompanies(filteredCompanies);
            return filteredCompanies;
        } catch (error) {
            console.error("Failed to fetch companies", error);
            toast({
                title: 'Error',
                description: 'Failed to load companies',
                variant: 'destructive',
            });
            return [];
        }
    };

    // Fetch Departments for ALL companies
    const fetchDepartments = async (companiesList: Company[]) => {
        try {
            let allDepts: Department[] = [];
            for (const company of companiesList) {
                // Fetch all departments for this company (chunked by 1000 to get all)
                const data = await departmentService.getAllDepartments(company.id.toString(), 0, 1000);
                const content = data.content || [];
                allDepts = [...allDepts, ...content];
            }
            // Sort departments with newest first (reverse order by ID)
            allDepts.sort((a, b) => parseInt(b.id) - parseInt(a.id));
            setDepartments(allDepts);
        } catch (error) {
            console.error("Failed to fetch departments", error);
            toast({
                title: 'Error',
                description: 'Failed to load departments',
                variant: 'destructive',
            });
        }
    };

    // Initial Load
    useEffect(() => {
        const init = async () => {
            const comps = await fetchCompanies();
            if (comps.length > 0) {
                await fetchDepartments(comps);
            }
        };
        init();
    }, []);

    // Filter Logic
    const filteredDepartments = departments.filter(dept =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Client-Side Pagination Logic
    const totalPages = Math.max(1, Math.ceil(filteredDepartments.length / itemsPerPage));
    const currentItems = filteredDepartments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleOpenDialog = async (dept?: Department) => {
        if (dept) {
            setEditingDept(dept);
            setFormData({
                name: dept.name,
                companyId: dept.companyId || ''
            });
            setIsDialogOpen(true);

            // Fetch fresh details
            try {
                const fullDept = await departmentService.getDepartmentById(dept.id);
                setEditingDept(fullDept);
                setFormData({
                    name: fullDept.name,
                    companyId: fullDept.companyId || ''
                });
            } catch (error) {
                console.error("Failed to fetch department details", error);
            }
        } else {
            setEditingDept(null);
            setFormData({ name: '', companyId: '' });
            setIsDialogOpen(true);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.companyId) {
            toast({
                title: 'Error',
                description: 'Please fill in all fields',
                variant: 'destructive',
            });
            return;
        }

        try {
            if (editingDept) {
                await departmentService.updateDepartment(editingDept.id, formData);
                toast({
                    title: 'Success',
                    description: 'Department updated successfully',
                });
            } else {
                await departmentService.addDepartment(formData);
                toast({
                    title: 'Success',
                    description: 'Department created successfully',
                });
            }
            setIsDialogOpen(false);
            // Refresh Data
            const comps = await fetchCompanies(); // Re-fetch companies in case new added (unlikely here but good practice)
            await fetchDepartments(comps);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save department',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
            try {
                await departmentService.deleteDepartment(id);
                toast({
                    title: 'Success',
                    description: 'Department deleted successfully',
                });
                // Refresh
                const comps = companies.length > 0 ? companies : await fetchCompanies();
                await fetchDepartments(comps);
            } catch (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to delete department. Please try again.',
                    variant: 'destructive',
                });
            }
        }
    };

    const getCompanyName = (id: string) => {
        const comp = companies.find(c => c.id.toString() === id.toString());
        return comp ? comp.name : 'Unknown';
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
                                                <SelectItem key={company.id} value={company.id.toString()}>
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
                                    <TableHead>Company</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentItems.map((dept) => (
                                    <TableRow key={dept.id}>
                                        <TableCell className="font-medium">{dept.name}</TableCell>
                                        <TableCell>{getCompanyName(dept.companyId)}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-2">
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
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-muted-foreground">
                            Total Departments: {filteredDepartments.length}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <span className="px-2 flex items-center">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};
