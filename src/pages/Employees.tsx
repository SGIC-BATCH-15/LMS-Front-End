import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { UserAvatar } from '@/components/atoms/Avatar/UserAvatar';
import { departments } from '@/data/departments';
import { companies } from '@/data/companies';
import { roles } from '@/data/roles';
import { designationsList } from '@/data/designationsList';
import { LeaveBalance, User, UserRole } from '@/types';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Pencil, Trash2, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInYears } from 'date-fns';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export const Employees: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, addLeaveBalances } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    companyId: '',
    departmentId: '',
    role: '' as UserRole,
    designation: '',
    joinDate: '',
    previousExperience: 0,
  });

  // Derived state for department filtering in dialog
  const dialogDepartments = departments.filter(d => d.companyId === formData.companyId);



  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || user.departmentId === filterDepartment;
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesDepartment && matchesRole;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDepartment, filterRole]);

  const [editingUser, setEditingUser] = useState<User | null>(null);

  const calculateCurrentExperience = (joinDateStr: string) => {
    if (!joinDateStr) return 0;
    const joinDate = new Date(joinDateStr);
    const now = new Date();
    return Math.max(0, differenceInYears(now, joinDate));
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      // Determine company from department
      const dept = departments.find(d => d.id === user.departmentId);
      const companyId = dept?.companyId || '';

      setFormData({
        firstName: user.firstName || user.name.split(' ')[0], // Fallback if firstName missing
        lastName: user.lastName || user.name.split(' ').slice(1).join(' '), // Fallback
        email: user.email,
        password: user.password || '', // Usually empty for edit, but mock needs it
        companyId: companyId,
        departmentId: user.departmentId,
        role: user.role,
        designation: user.designation || '',
        joinDate: user.joinDate || new Date().toISOString().split('T')[0], // Fallback
        previousExperience: user.previousExperience || 0,
      });
    } else {
      setEditingUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        companyId: '', // Reset
        departmentId: '',
        role: '' as UserRole,
        designation: '',
        joinDate: new Date().toISOString().split('T')[0], // Default to today
        previousExperience: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.departmentId || !formData.role || !formData.joinDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Password validation for new users
    if (!editingUser && !formData.password) {
      toast.error('Password is required for new employees');
      return;
    }

    const calculatedCurrentExp = calculateCurrentExperience(formData.joinDate);
    const fullName = `${formData.firstName} ${formData.lastName}`;

    if (editingUser) {
      // Update existing user
      const updatedUser: User = {
        ...editingUser,
        name: fullName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password || editingUser.password, // Keep old pass if empty on edit
        departmentId: formData.departmentId,
        role: formData.role,
        designation: formData.designation,
        joinDate: formData.joinDate,
        currentExperience: calculatedCurrentExp,
        previousExperience: formData.previousExperience,
      };

      updateUser(updatedUser);
      toast.success('Employee updated successfully');
    } else {
      // Create new user
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: fullName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        departmentId: formData.departmentId,
        designation: formData.designation || 'Employee',
        joinDate: formData.joinDate,
        currentExperience: calculatedCurrentExp,
        previousExperience: formData.previousExperience,
      };

      addUser(newUser);
      // NOTE: We do NOT adding balances here anymore. 
      // Balances will be allocated via the "Leave Allocation" page as per user workflow.

      toast.success('Employee added successfully');
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      deleteUser(userId);
      toast.success('Employee deleted successfully');
    }
  };

  const getDepartmentName = (deptId: string) => {
    return departments.find(d => d.id === deptId)?.name || 'Unknown';
  };

  return (
    <DashboardLayout title="Employees" subtitle="Manage employee records and leave balances">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">

                {/* Names */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                {/* Email & Password */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password {editingUser ? '(Leave empty to keep)' : '*'}</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder={editingUser ? "******" : "Required"}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                {/* Company & Department */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company *</Label>
                    <Select
                      value={formData.companyId}
                      onValueChange={v => setFormData({ ...formData, companyId: v, departmentId: '' })} // Reset department on company change
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map(comp => (
                          <SelectItem key={comp.id} value={comp.id}>{comp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Select
                      value={formData.departmentId}
                      onValueChange={v => setFormData({ ...formData, departmentId: v })}
                      disabled={!formData.companyId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {dialogDepartments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Role & Designation */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={v => setFormData({ ...formData, role: v as UserRole })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.id} value={role.key}>{role.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Select
                      value={formData.designation}
                      onValueChange={v => setFormData({ ...formData, designation: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Designation" />
                      </SelectTrigger>
                      <SelectContent>
                        {designationsList.map(des => (
                          <SelectItem key={des.id} value={des.name}>{des.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dates & Experience */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="joinDate">Join Date *</Label>
                    <Input
                      id="joinDate"
                      type="date"
                      value={formData.joinDate}
                      onChange={e => setFormData({ ...formData, joinDate: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: {calculateCurrentExperience(formData.joinDate)} years
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prevExp">Previous Exp (Years)</Label>
                    <Input
                      id="prevExp"
                      type="number"
                      min="0"
                      value={formData.previousExperience}
                      onChange={e => setFormData({ ...formData, previousExperience: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave}>{editingUser ? 'Update' : 'Create'} Employee</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Employee Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map(user => {
                const totalExp = (user.currentExperience || 0) + (user.previousExperience || 0);

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar name={user.name} size="sm" />
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        {getDepartmentName(user.departmentId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium capitalize',
                        user.role === 'admin' && 'bg-primary/10 text-primary',
                        user.role === 'manager' && 'bg-info/10 text-info',
                        user.role === 'staff' && 'bg-muted text-muted-foreground'
                      )}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{user.designation}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium flex items-center gap-1">
                          {totalExp} Years
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.currentExperience}y Curr + {user.previousExperience}y Prev
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(user)} title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(user.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination className="mt-4">
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
