import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { UserAvatar } from '@/components/atoms/Avatar/UserAvatar';


import { Company } from '@/data/companies';
import { roles as mockRoles } from '@/data/roles';
import { designationsList } from '@/data/designationsList';
import { companyService } from '@/components/services/companyService';
import { departmentService, Department as APIDepartment } from '@/components/services/departmentService';
import { roleService, Role as APIRole } from '@/components/services/roleService';
import { employeeService, AddEmployeeRequest, UpdateEmployeeRequest } from '@/components/services/employeeService';
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
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<APIDepartment[]>([]);
  const [roles, setRoles] = useState<APIRole[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('all');
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
    role: '', // Store role ID as string
    designation: '',
    joinDate: '',
    previousExperience: 0,
  });

  // Derived state for department filtering in dialog
  const dialogDepartments = departments;

  // Function to fetch departments when company changes
  const fetchDepartmentsByCompany = async (companyId: string) => {
    if (!companyId) {
      setDepartments([]);
      return;
    }
    
    setLoadingDepartments(true);
    try {
      // Always use companyId 1
      const departmentsData = await departmentService.getDepartmentsByCompanyId('1');
      setDepartments(departmentsData);
      
      if (departmentsData.length === 0) {
        console.log(`ℹ️ No departments found for company ${companyId}`);
      } else {
        console.log(`✅ Loaded ${departmentsData.length} departments for company ${companyId}`);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      toast.error('Failed to load departments for this company.');
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Mock balances state (in a real app this would be fetched)
  const [balances, setBalances] = useState<LeaveBalance[]>([]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = filterCompany === 'all' || user.companyId === filterCompany;
    const matchesDepartment = filterDepartment === 'all' || user.departmentId === filterDepartment;
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesCompany && matchesDepartment && matchesRole;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  // Fetch companies from API
  useEffect(() => {
    const fetchCompanies = async () => {
      console.log('🚀 Starting to fetch companies...');
      
      // Check if user has authentication token
      const token = localStorage.getItem('authToken');
      if (!token || token === 'undefined' || token === 'null') {
        console.warn('🔒 No valid authentication token found');
        toast.error('Please login to load companies from backend.');
        setCompanies([]);
        return;
      }
      
      console.log('🔑 Authentication token found, proceeding with API call...');
      setLoadingCompanies(true);
      try {
        console.log('📞 Calling companyService.getAllCompanies()...');
        const companiesData = await companyService.getAllCompanies();
        console.log('✅ Received companies data:', companiesData);
        
        // Ensure we have a valid array
        if (Array.isArray(companiesData)) {
          console.log(`🎉 Setting ${companiesData.length} companies to state`);
          // Filter to only show company with ID 1
          const filteredCompanies = companiesData.filter(company => company.id === '1' || company.id === 1);
          setCompanies(filteredCompanies);
          toast.success(`Successfully loaded ${filteredCompanies.length} companies from backend`);
        } else {
          console.warn('⚠️ API returned non-array data:', companiesData);
          toast.error('Invalid data format received from backend.');
          setCompanies([]);
        }
      } catch (error) {
        console.error('❌ Failed to fetch companies:', error);
        if (error.message?.includes('Authentication')) {
          toast.error('Authentication failed. Please login again.');
        } else {
          toast.error('Failed to load companies from backend. Check console for details.');
        }
        setCompanies([]);
      } finally {
        console.log('🏁 Finished loading companies');
        setLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, []);

  // Fetch employees when company filter changes
  useEffect(() => {
    const fetchEmployeesByCompany = async () => {
      // Skip if no company is selected or "all" is selected
      if (filterCompany === 'all') {
        console.log('📋 Showing all employees (no company filter)');
        return;
      }

      const token = localStorage.getItem('authToken');
      if (!token || token === 'undefined' || token === 'null') {
        console.warn('🔒 No valid authentication token for fetching employees');
        toast.error('Please login to load employees from backend.');
        return;
      }

      console.log(`🚀 Fetching employees for company ID: ${filterCompany}`);
      try {
        const employeesData = await employeeService.getEmployeesByCompany(parseInt(filterCompany));
        console.log('✅ Received employees data:', employeesData);
        
        if (Array.isArray(employeesData) && employeesData.length > 0) {
          // Convert backend employee data to User format
          const mappedEmployees = employeesData.map(emp => {
            // Get the role name from roleIds
            let roleName: UserRole = 'employee';
            if (emp.roleIds && emp.roleIds.length > 0 && roles.length > 0) {
              const roleObj = roles.find(r => r.id === emp.roleIds[0]);
              if (roleObj) {
                roleName = roleObj.name.toLowerCase() as UserRole;
              }
            }
            
            return {
              id: emp.id?.toString() || '',
              name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
              firstName: emp.firstName || '',
              lastName: emp.lastName || '',
              email: emp.email || '',
              password: emp.password || '',
              role: roleName,
              roleIds: emp.roleIds || [], // Store roleIds for editing
              departmentId: emp.departmentId?.toString() || '',
              companyId: emp.companyId?.toString() || filterCompany,
              designation: emp.designationId?.toString() || '',
              joinDate: emp.joinDate || '',
              currentExperience: 0,
              previousExperience: emp.previousExperience || 0,
            };
          });
          
          setUsers(mappedEmployees);
          toast.success(`Loaded ${mappedEmployees.length} employees for selected company`);
        } else if (employeesData.length === 0) {
          setUsers([]);
          toast.info('No employees found for selected company');
        }
      } catch (error) {
        console.error('❌ Failed to fetch employees by company:', error);
        toast.error('Failed to load employees. Check console for details.');
      }
    };

    fetchEmployeesByCompany();
  }, [filterCompany]);

  // Fetch roles from API
  useEffect(() => {
    const fetchRoles = async () => {
      console.log('🚀 Starting to fetch roles...');
      
      // Check if user has authentication token
      const token = localStorage.getItem('authToken');
      if (!token || token === 'undefined' || token === 'null') {
        console.warn('🔒 No valid authentication token found for roles');
        toast.error('Please login to load roles from backend.');
        setRoles([]);
        return;
      }
      
      console.log('🔑 Authentication token found, proceeding with roles API call...');
      setLoadingRoles(true);
      try {
        console.log('📞 Calling roleService.getAllRoles()...');
        const rolesData = await roleService.getAllRoles();
        console.log('✅ Received roles data:', rolesData);
        console.log('🔢 Roles array length:', rolesData?.length);
        
        // Ensure we have a valid array
        if (Array.isArray(rolesData) && rolesData.length > 0) {
          console.log(`🎉 Setting ${rolesData.length} roles to state`);
          setRoles(rolesData);
          toast.success(`Successfully loaded ${rolesData.length} roles from backend`);
        } else if (Array.isArray(rolesData) && rolesData.length === 0) {
          console.warn('⚠️ API returned empty roles array');
          setRoles([]);
          toast.info('No roles found in backend.');
        } else {
          console.warn('⚠️ API returned non-array roles data:', rolesData);
          toast.error('Invalid roles data format received.');
          setRoles([]);
        }
      } catch (error) {
        console.error('❌ Failed to fetch roles:', error);
        console.error('❌ Error details:', error.message);
        if (error.message?.includes('Authentication')) {
          toast.error('Authentication failed for roles. Please login again.');
        } else {
          toast.error('Failed to load roles from backend. Check console for details.');
        }
        // Set empty array as fallback
        setRoles([]);
      } finally {
        console.log('🏁 Finished loading roles');
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  // Fetch departments from API
  useEffect(() => {
    const fetchDepartments = async () => {
      console.log('🚀 Starting to fetch departments...');
      
      const token = localStorage.getItem('authToken');
      if (!token || token === 'undefined' || token === 'null') {
        console.warn('🔒 No valid authentication token found for departments');
        setDepartments([]);
        return;
      }
      
      setLoadingDepartments(true);
      try {
        console.log('📞 Calling departmentService.getDepartmentsByCompanyId()...');
        const departmentsData = await departmentService.getDepartmentsByCompanyId('1');
        console.log('✅ Received departments data:', departmentsData);
        
        if (Array.isArray(departmentsData) && departmentsData.length > 0) {
          console.log(`🎉 Setting ${departmentsData.length} departments to state`);
          setDepartments(departmentsData);
        } else {
          console.log('ℹ️ No departments found');
          setDepartments([]);
        }
      } catch (error) {
        console.error('❌ Failed to fetch departments:', error);
        toast.error('Failed to load departments from backend.');
        setDepartments([]);
      } finally {
        console.log('🏁 Finished loading departments');
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, []);

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
      // Get company from user's companyId directly
      const companyId = user.companyId || '';
      
      // Find the role ID from the role name
      const userRole = roles.find(role => role.name.toLowerCase() === user.role.toLowerCase());
      const roleId = userRole ? userRole.id.toString() : '';

      console.log('🔍 Editing user:', user);
      console.log('🔍 Company ID:', companyId, 'Type:', typeof companyId);
      console.log('🔍 Role ID:', roleId, 'Type:', typeof roleId);
      console.log('🔍 Department ID:', user.departmentId, 'Type:', typeof user.departmentId);

      setFormData({
        firstName: user.firstName || user.name.split(' ')[0], // Fallback if firstName missing
        lastName: user.lastName || user.name.split(' ').slice(1).join(' '), // Fallback
        email: user.email,
        password: user.password || '', // Usually empty for edit, but mock needs it
        companyId: companyId.toString(),
        departmentId: user.departmentId.toString(),
        role: roleId, // Set role ID instead of role name
        designation: user.designation || '',
        joinDate: user.joinDate || new Date().toISOString().split('T')[0], // Fallback
        previousExperience: user.previousExperience || 0,
      });

      console.log('✅ Form data set:', {
        companyId: companyId.toString(),
        departmentId: user.departmentId.toString(),
        role: roleId
      });

      // Load departments for the company when editing
      if (companyId) {
        fetchDepartmentsByCompany(companyId);
      }
    } else {
      setEditingUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        companyId: '', // Reset
        departmentId: '',
        role: '', // Reset to empty string for role ID
        designation: '',
        joinDate: new Date().toISOString().split('T')[0], // Default to today
        previousExperience: 0,
      });
      // Clear departments for new user
      setDepartments([]);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.departmentId || !formData.role || !formData.joinDate) {
      console.log('❌ Validation failed - missing required fields:', {
        firstName: !!formData.firstName,
        lastName: !!formData.lastName,
        email: !!formData.email,
        departmentId: !!formData.departmentId,
        role: !!formData.role,
        joinDate: !!formData.joinDate
      });
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Additional validation for role ID
    const roleId = parseInt(formData.role);
    if (isNaN(roleId) || roleId <= 0) {
      console.log('❌ Invalid role ID:', formData.role, 'Parsed:', roleId);
      toast.error('Please select a valid role');
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
      // Update existing user - save to backend database
      console.log('🚀 Starting to update employee in backend database...');
      setSavingEmployee(true);
      try {
        console.log('📝 Preparing employee data for backend update...');
        console.log('🔍 Editing user ID:', editingUser.id);
        console.log('🔍 Form data:', formData);
        
        const roleId = parseInt(formData.role);
        if (isNaN(roleId) || roleId <= 0) {
          throw new Error('Invalid role selection');
        }
        
        const updateData: UpdateEmployeeRequest = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          password: formData.password || undefined, // Only send if changed
          companyId: parseInt(formData.companyId),
          departmentId: parseInt(formData.departmentId),
          roleIds: [roleId],
          joinDate: formData.joinDate,
          previousExperience: formData.previousExperience,
        };

        console.log('📤 Sending update data to backend:', updateData);
        console.log('📤 Final JSON payload:', JSON.stringify(updateData, null, 2));
        
        const response = await employeeService.updateEmployee(editingUser.id, updateData);
        
        console.log('✅ Employee updated successfully in database:', response);
        toast.success('Employee updated successfully in the database!');
        
        // Update local state for immediate UI update
        const selectedRole = roles.find(role => role.id.toString() === formData.role);
        const roleName = selectedRole ? selectedRole.name.toLowerCase() as UserRole : 'employee' as UserRole;
        
        const updatedUser: User = {
          ...editingUser,
          name: fullName,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password || editingUser.password,
          companyId: formData.companyId,
          departmentId: formData.departmentId,
          role: roleName,
          roleIds: [roleId],
          designation: formData.designation,
          joinDate: formData.joinDate,
          currentExperience: calculatedCurrentExp,
          previousExperience: formData.previousExperience,
        };

        console.log('➕ Updating employee in local UI state');
        setUsers(users.map(u => u.id === editingUser.id ? updatedUser : u));
        
      } catch (error) {
        console.error('❌ Failed to update employee in database:', error);
        console.error('❌ Error message:', error.message);
        toast.error(`Failed to update employee: ${error.message}`);
        return; // Don't close dialog on error
      } finally {
        setSavingEmployee(false);
      }
    } else {
      // Add new user - save to backend database
      console.log('🚀 Starting to save new employee to backend database...');
      setSavingEmployee(true);
      try {
        console.log('📝 Preparing employee data for backend...');
                console.log('🔍 Form data before creating employee object:', formData);
        console.log('🔍 Role value from form:', formData.role, 'Type:', typeof formData.role);
        console.log('🔍 Parsed role ID:', parseInt(formData.role), 'IsNaN:', isNaN(parseInt(formData.role)));
        console.log('🔍 Available roles:', roles.map(r => ({ id: r.id, name: r.name, type: typeof r.id })));
        
        const roleId = parseInt(formData.role);
        if (isNaN(roleId) || roleId <= 0) {
          throw new Error('Invalid role selection');
        }
        
        const employeeData: AddEmployeeRequest = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          companyId: parseInt(formData.companyId),
          departmentId: parseInt(formData.departmentId),
          roleIds: [roleId], // Matches backend DTO: List<Long> roleIds
          joinDate: formData.joinDate,
          previousExperience: formData.previousExperience,
        };

        console.log('📤 Sending employee data to backend:', employeeData);
        console.log('📤 Final JSON payload:', JSON.stringify(employeeData, null, 2));
        
        const response = await employeeService.addEmployee(employeeData);
        
        console.log('✅ Employee saved successfully to database:', response);
        toast.success('Employee added successfully to the database!');
        
        // Add to local state for immediate UI update
        // Find the role name from the roles array using the roleId
        const selectedRole = roles.find(role => role.id.toString() === formData.role);
        const roleName = selectedRole ? selectedRole.name.toLowerCase() as UserRole : 'employee' as UserRole;
        
        const newUser: User = {
          id: response.data.id.toString(),
          name: fullName,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          departmentId: formData.departmentId,
          role: roleName, // Use the role name, not the ID
          designation: formData.designation,
          joinDate: formData.joinDate,
          currentExperience: calculatedCurrentExp,
          previousExperience: formData.previousExperience,
        };
        
        console.log('➕ Adding employee to local UI state for immediate display');
        setUsers([...users, newUser]);
        
      } catch (error) {
        console.error('❌ Failed to save employee to database:', error);
        console.error('❌ Error message:', error.message);
        toast.error(error.message || 'Failed to save employee to database. Please try again.');
        return; // Don't close dialog on error
      } finally {
        setSavingEmployee(false);
      }
    }

    setIsDialogOpen(false);
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      console.log('🗑️ Starting to delete employee from backend database...');
      try {
        await employeeService.deleteEmployee(userId);
        
        console.log('✅ Employee deleted successfully from database');
        toast.success('Employee deleted successfully from the database!');
        
        // Remove from local state
        setUsers(users.filter(u => u.id !== userId));
        setBalances(prev => prev.filter(b => b.userId !== userId));
        
      } catch (error) {
        console.error('❌ Failed to delete employee from database:', error);
        console.error('❌ Error message:', error.message);
        toast.error(`Failed to delete employee: ${error.message}`);
      }
    }
  };

  const getDepartmentName = (deptId: string) => {
    return departments.find(d => d.id === parseInt(deptId))?.name || 'Unknown';
  };

  const getUserBalances = (userId: string) => {
    // Combine mock balances with newly created ones
    const local = balances.filter(b => b.userId === userId);
    if (local.length > 0) return local;
    return [];
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
            <Select value={filterCompany} onValueChange={setFilterCompany}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {loadingCompanies ? (
                  <SelectItem value="loading" disabled>Loading companies...</SelectItem>
                ) : companies.length === 0 ? (
                  <SelectItem value="no-data" disabled>No companies found</SelectItem>
                ) : (
                  companies.map(company => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.companyName || company.name || 'Unnamed Company'}
                    </SelectItem>
                  ))
                )}\n              </SelectContent>
            </Select>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {loadingDepartments ? (
                  <SelectItem value="loading" disabled>Loading departments...</SelectItem>
                ) : departments.length === 0 ? (
                  <SelectItem value="no-data" disabled>No departments found</SelectItem>
                ) : (
                  departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>{dept.departmentName}</SelectItem>
                  ))
                )}
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
                <SelectItem value="staff">Staff</SelectItem>                <SelectItem value="employee">Employee</SelectItem>              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
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
                      onValueChange={(value) => {
                        setFormData({ ...formData, companyId: value, departmentId: '' });
                        fetchDepartmentsByCompany(value);
                      }}
                      disabled={loadingCompanies}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingCompanies ? "Loading companies..." : "Select Company"} />
                      </SelectTrigger>
                      <SelectContent>
                        {(companies || []).map(comp => (
                          <SelectItem key={comp.id} value={comp.id.toString()}>
                            {comp.companyName || comp.name || 'Unnamed Company'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Select
                      value={formData.departmentId}
                      onValueChange={v => setFormData({ ...formData, departmentId: v })}
                      disabled={!formData.companyId || loadingDepartments}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !formData.companyId ? "Select Company first" : 
                          loadingDepartments ? "Loading departments..." :
                          "Select Department"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.length === 0 && formData.companyId && !loadingDepartments ? (
                          <SelectItem value="no-departments" disabled className="text-muted-foreground italic">
                            No departments exist
                          </SelectItem>
                        ) : (
                          dialogDepartments.map(dept => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.departmentName || dept.name || 'Unnamed Department'}
                            </SelectItem>
                          ))
                        )}
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
                      onValueChange={v => setFormData({ ...formData, role: v })} // Remove UserRole casting
                      disabled={loadingRoles}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingRoles ? "Loading roles..." : "Select Role"} />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.length === 0 && !loadingRoles ? (
                          <SelectItem value="no-roles" disabled className="text-muted-foreground italic">
                            No roles available
                          </SelectItem>
                        ) : (
                          roles.map(role => (
                            <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>
                          ))
                        )}
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
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={savingEmployee}>Cancel</Button>
                  <Button onClick={handleSave} disabled={savingEmployee}>
                    {savingEmployee ? (
                      <>
                        <span className="mr-2">Saving...</span>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      </>
                    ) : (
                      `${editingUser ? 'Update' : 'Create'} Employee`
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
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