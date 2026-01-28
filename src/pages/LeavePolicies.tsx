import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { LeaveTypeBadge } from '@/components/atoms/Badge/LeaveTypeBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Pencil, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { LeavePolicy, LeaveType } from '@/types';
import {
  getAllLeavePolicies,
  addLeavePolicy,
  updateLeavePolicy,
  deleteLeavePolicy,
  BackendLeavePolicyRequest
} from '@/components/services/leavePoliciesServices';
import { getAllLeaveTypes, LeaveTypeResponseDto } from '@/components/services/leavetypeService';
import { useToast } from "@/components/ui/use-toast";
import { useRolePrivilege } from '@/context/RolePrivilegeContext';

interface PolicyFormData {
  leaveType: LeaveType | '';
  minExperience: number;
  maxExperience: number;
  daysAllowed: number;
  carryForward: boolean;
  maxCarryForward: number;
}

const initialFormData: PolicyFormData = {
  leaveType: '',
  minExperience: 0,
  maxExperience: 1, // Defaulting to 1 year instead of 100
  daysAllowed: 10,
  carryForward: false,
  maxCarryForward: 0,
};

const KNOWN_LEAVE_TYPES = ['annual', 'casual', 'sick', 'maternity', 'paternity', 'unpaid'];

export const LeavePolicies: React.FC = () => {
  const { hasRolePrivilege } = useRolePrivilege();
  const [filterType, setFilterType] = useState('all');
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [formData, setFormData] = useState<PolicyFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeResponseDto[]>([]);

  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<string | null>(null);

  // Track original form data for update button state
  const [originalFormData, setOriginalFormData] = useState<PolicyFormData>(initialFormData);
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());
  const [formError, setFormError] = useState<string | null>(null);

  // Client-Side Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { toast } = useToast();

  useEffect(() => {
    fetchPolicies();
    fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    try {
      const response = await getAllLeaveTypes(0, 100);
      if (response && response.content) {
        setLeaveTypes(response.content);
      }
    } catch (error) {
      console.error("Failed to fetch leave types", error);
    }
  };

  const fetchPolicies = async () => {
    try {
      // Fetch ALL policies for client-side pagination (size=1000)
      const response = await getAllLeavePolicies(0, 1000);
      if (response.data && response.data.content) {
        const mappedPolicies: LeavePolicy[] = response.data.content.map((p) => ({
          id: p.id.toString(),
          leaveType: (p.leaveType.leaveType.toLowerCase() as LeaveType),
          minExperience: p.minExperience,
          maxExperience: p.maxExperience,
          daysAllowed: p.daysAllowed,
          carryForward: p.carryForwardAllowed,
          maxCarryForward: p.maxCarryForwardDays || 0,
        }));

        // Sort policies in descending order by ID (newest first - LIFO)
        mappedPolicies.sort((a, b) => parseInt(b.id) - parseInt(a.id));

        setPolicies(mappedPolicies);
        // Note: totalPages will be calculated derived from filtered list length
      }
    } catch (error) {
      console.error("Failed to fetch policies", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch policies",
      });
    }
  };

  const filteredPolicies = policies.filter(policy => {
    const matchesType = filterType === 'all' || policy.leaveType === filterType;
    return matchesType;
  });

  // Client-Side Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredPolicies.length / itemsPerPage));
  const currentPolicies = filteredPolicies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType]);

  const handleInputChange = (field: keyof PolicyFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear global form error on any input change
    if (formError) setFormError(null);

    // Track modified fields when in edit mode
    if (editingPolicy) {
      const isModified = originalFormData[field] !== value;
      setModifiedFields(prev => {
        const newSet = new Set(prev);
        if (isModified) {
          newSet.add(field);
        } else {
          newSet.delete(field);
        }
        return newSet;
      });
    }

    // Clear error for the field being edited
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const getLeaveTypeIdByName = (name: string): number | undefined => {
    const found = leaveTypes.find(lt => lt.leaveType === name) ||
      leaveTypes.find(lt => lt.leaveType.toLowerCase() === name.toLowerCase());
    return found?.id;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!formData.leaveType) {
      newErrors.leaveType = "Leave Type is required";
      isValid = false;
    }

    if (formData.minExperience < 0) {
      newErrors.minExperience = "Min experience cannot be negative";
      isValid = false;
    }

    if (formData.maxExperience <= 0) {
      newErrors.maxExperience = "Max experience must be greater than 0";
      isValid = false;
    }

    if (formData.maxExperience > 50) {
      newErrors.maxExperience = "Max experience cannot exceed 50 years";
      isValid = false;
    }

    if (formData.minExperience >= formData.maxExperience) {
      newErrors.minExperience = "Min experience must be less than max experience";
      isValid = false;
    }

    if (formData.daysAllowed <= 0) {
      newErrors.daysAllowed = "Days allowed must be greater than 0";
      isValid = false;
    }

    if (formData.carryForward && formData.maxCarryForward < 0) {
      newErrors.maxCarryForward = "Max carry forward cannot be negative";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Check for duplicate policy
    // Check for overlapping experience ranges for the same leave type
    const isOverlapping = policies.some(policy => {
      // Skip current policy if editing
      if (editingPolicy && policy.id === editingPolicy.id) return false;

      // Only check overlapping for the same Leave Type
      if (policy.leaveType.toLowerCase() !== formData.leaveType.toLowerCase()) return false;

      // Check if ranges overlap: (StartA < EndB) && (EndA > StartB)
      // Using < and >= to handle contiguous ranges correctly if needed, but typically overlap is strict
      // User scenario: If 0-3 exists, don't allow 0-1 or 0-2 (which are subsets)
      // This simple intersection logic covers subsets, supersets, and partial overlaps
      const isOverlap = (formData.minExperience < policy.maxExperience) && (formData.maxExperience > policy.minExperience);

      return isOverlap;
    });

    if (isOverlapping) {
      setFormError("Experience range overlaps with an existing policy for this Leave Type.");
      return;
    }

    const leaveTypeId = getLeaveTypeIdByName(formData.leaveType);
    if (!leaveTypeId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid Leave Type Selected",
      });
      return;
    }

    const payload: BackendLeavePolicyRequest = {
      leaveTypeId: leaveTypeId,
      minExperience: formData.minExperience,
      maxExperience: formData.maxExperience,
      daysAllowed: formData.daysAllowed,
      carryForwardAllowed: formData.carryForward,
      maxCarryForwardDays: formData.carryForward ? formData.maxCarryForward : 0,
    };

    try {
      if (editingPolicy) {
        await updateLeavePolicy(parseInt(editingPolicy.id), payload);
        toast({
          title: "Success",
          description: "Policy updated successfully",
        });
      } else {
        await addLeavePolicy(payload);
        toast({
          title: "Success",
          description: "Policy added successfully",
        });
        // Navigate to first page to see the new policy at the top
        setCurrentPage(1);
      }
      fetchPolicies();
      setFormData(initialFormData);
      setOriginalFormData(initialFormData);
      setModifiedFields(new Set());
      setIsDialogOpen(false);
      setEditingPolicy(null);
    } catch (error) {
      console.error("Error saving policy", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save policy",
      });
    }
  };

  const handleEditPolicy = (policy: LeavePolicy) => {
    setEditingPolicy(policy);
    const policyFormData = {
      leaveType: policy.leaveType,
      minExperience: policy.minExperience,
      maxExperience: policy.maxExperience,
      daysAllowed: policy.daysAllowed,
      carryForward: policy.carryForward,
      maxCarryForward: policy.maxCarryForward,
    };
    setFormData(policyFormData);
    setOriginalFormData(policyFormData);
    setModifiedFields(new Set());
    setErrors({});
    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleOpenDialog = () => {
    setEditingPolicy(null);
    setFormData(initialFormData);
    setOriginalFormData(initialFormData);
    setModifiedFields(new Set());
    setErrors({});
    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleDeletePolicy = (policyId: string) => {
    setPolicyToDelete(policyId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!policyToDelete) return;

    try {
      // Call the delete API
      await deleteLeavePolicy(parseInt(policyToDelete));

      // Immediately remove from the current view without refetching
      setPolicies(prev => prev.filter(p => p.id !== policyToDelete));

      // Show success message
      toast({
        title: "Success",
        description: "Policy deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete policy", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete policy",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setPolicyToDelete(null);
    }
  };

  return (
    <DashboardLayout title="Leave Policies" subtitle="Configure leave policies based on experience">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {leaveTypes.map(lt => (
                  <SelectItem key={lt.id} value={lt.leaveType.toLowerCase()}>{lt.leaveType}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingPolicy(null);
              setFormData(initialFormData);
              setOriginalFormData(initialFormData);
              setModifiedFields(new Set());
              setErrors({});
              setFormError(null);
            }
          }}>
            <DialogTrigger asChild>
              {hasRolePrivilege('MANAGE_LEAVE_POLICIES', 'canWrite') && (
                <Button className="gap-2" onClick={handleOpenDialog}>
                  <Plus className="w-4 h-4" />
                  Add Policy
                </Button>
              )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingPolicy ? 'Edit Leave Policy' : 'Add New Leave Policy'}</DialogTitle>
                <DialogDescription>
                  {editingPolicy ? 'Update leave policy information based on experience range' : 'Create a new leave policy with experience-based allocation'}
                </DialogDescription>
              </DialogHeader>

              {formError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {formError}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4 py-4">
                {/* Leave Type */}
                <div className="space-y-2">
                  <Label htmlFor="leaveType">Leave Type</Label>
                  <Select
                    value={formData.leaveType}
                    onValueChange={(value) => handleInputChange('leaveType', value as LeaveType)}
                  >
                    <SelectTrigger id="leaveType">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map(lt => (
                        <SelectItem key={lt.id} value={lt.leaveType.toLowerCase()}>{lt.leaveType}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.leaveType && <span className="text-destructive text-xs">{errors.leaveType}</span>}
                </div>

                {/* Experience Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minExperience">Min Experience (years)</Label>
                    <Input
                      id="minExperience"
                      type="number"
                      min={0}
                      value={formData.minExperience}
                      onChange={(e) => handleInputChange('minExperience', parseInt(e.target.value) || 0)}
                      className={modifiedFields.has('minExperience') ? 'font-semibold' : ''}
                    />
                    {errors.minExperience && <span className="text-destructive text-xs">{errors.minExperience}</span>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxExperience">Max Experience (years)</Label>
                    <Input
                      id="maxExperience"
                      type="number"
                      min={0}
                      max={50}
                      value={formData.maxExperience}
                      onChange={(e) => handleInputChange('maxExperience', parseInt(e.target.value) || 0)}
                      className={modifiedFields.has('maxExperience') ? 'font-semibold' : ''}
                    />
                    {errors.maxExperience && <span className="text-destructive text-xs">{errors.maxExperience}</span>}
                  </div>
                </div>

                {/* Days Allowed */}
                <div className="space-y-2">
                  <Label htmlFor="daysAllowed">Days Allowed</Label>
                  <Input
                    id="daysAllowed"
                    type="number"
                    min={1}
                    value={formData.daysAllowed}
                    onChange={(e) => handleInputChange('daysAllowed', parseInt(e.target.value) || 1)}
                    className={modifiedFields.has('daysAllowed') ? 'font-semibold' : ''}
                  />
                  {errors.daysAllowed && <span className="text-destructive text-xs">{errors.daysAllowed}</span>}
                </div>

                {/* Carry Forward */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="carryForward">Allow Carry Forward</Label>
                  <Switch
                    id="carryForward"
                    checked={formData.carryForward}
                    onCheckedChange={(checked) => handleInputChange('carryForward', checked)}
                  />
                </div>

                {/* Max Carry Forward (shown only when carryForward is true) */}
                {formData.carryForward && (
                  <div className="space-y-2">
                    <Label htmlFor="maxCarryForward">Max Carry Forward (days)</Label>
                    <Input
                      id="maxCarryForward"
                      type="number"
                      min={0}
                      value={formData.maxCarryForward}
                      onChange={(e) => handleInputChange('maxCarryForward', parseInt(e.target.value) || 0)}
                      className={modifiedFields.has('maxCarryForward') ? 'font-semibold' : ''}
                    />
                    {errors.maxCarryForward && <span className="text-destructive text-xs">{errors.maxCarryForward}</span>}
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleSubmit}
                  disabled={editingPolicy ? modifiedFields.size === 0 : false}
                >
                  {editingPolicy ? 'Update Policy' : 'Add Policy'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Policies Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leave Type</TableHead>
                {/* Role column removed */}
                <TableHead>Experience Range</TableHead>
                <TableHead>Days Allowed</TableHead>
                <TableHead>Carry Forward</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPolicies.map(policy => (
                <TableRow key={policy.id}>
                  <TableCell>
                    {KNOWN_LEAVE_TYPES.includes(policy.leaveType) ? (
                      <LeaveTypeBadge type={policy.leaveType} size="sm" />
                    ) : (
                      <Badge variant="outline" className="capitalize">{policy.leaveType}</Badge>
                    )}
                  </TableCell>
                  {/* Role cell removed */}
                  <TableCell>
                    {policy.minExperience}y - {policy.maxExperience}y
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-foreground">{policy.daysAllowed} days</span>
                  </TableCell>
                  <TableCell>
                    {policy.carryForward ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-success" />
                        <span className="text-sm">Max {policy.maxCarryForward} days</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      {hasRolePrivilege('MANAGE_LEAVE_POLICIES', 'canUpdate') && (
                        <Button variant="ghost" size="sm" onClick={() => handleEditPolicy(policy)} title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {hasRolePrivilege('MANAGE_LEAVE_POLICIES', 'canDelete') && (
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeletePolicy(policy.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-muted-foreground">
              Total Leave Policies: {filteredPolicies.length}
            </span>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages || 1}
              </span>
              <Button
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Confirm Deletion
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete this leave policy? This action cannot be undone.
              </p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete Policy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};
