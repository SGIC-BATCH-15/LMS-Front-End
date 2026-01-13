import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { LeaveTypeBadge } from '@/components/atoms/Badge/LeaveTypeBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
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

interface PolicyFormData {
  leaveType: LeaveType;
  minExperience: number;
  maxExperience: number;
  daysAllowed: number;
  carryForward: boolean;
  maxCarryForward: number;
}

const initialFormData: PolicyFormData = {
  leaveType: 'annual',
  minExperience: 0,
  maxExperience: 100,
  daysAllowed: 10,
  carryForward: false,
  maxCarryForward: 0,
};

const KNOWN_LEAVE_TYPES = ['annual', 'casual', 'sick', 'maternity', 'paternity', 'unpaid'];

export const LeavePolicies: React.FC = () => {
  const [filterType, setFilterType] = useState('all');
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [formData, setFormData] = useState<PolicyFormData>(initialFormData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeResponseDto[]>([]);

  // Pagination State
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalPolicies, setTotalPolicies] = useState(0);
  const pageSize = 5;

  const { toast } = useToast();

  useEffect(() => {
    fetchPolicies();
    fetchLeaveTypes();
  }, [page]);

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
      // Logic for filtering is now handled in the service layer using strict verification
      const response = await getAllLeavePolicies(page, pageSize);
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
        setPolicies(mappedPolicies);
        setTotalPages(response.data.totalPages);
        setTotalPolicies(response.data.totalElements || response.data.content.length);
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

  const handleInputChange = (field: keyof PolicyFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getLeaveTypeIdByName = (name: string): number | undefined => {
    const found = leaveTypes.find(lt => lt.leaveType === name) ||
      leaveTypes.find(lt => lt.leaveType.toLowerCase() === name.toLowerCase());
    return found?.id;
  };

  const handleSubmit = async () => {
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
      }
      fetchPolicies();
      setFormData(initialFormData);
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
    setFormData({
      leaveType: policy.leaveType,
      minExperience: policy.minExperience,
      maxExperience: policy.maxExperience,
      daysAllowed: policy.daysAllowed,
      carryForward: policy.carryForward,
      maxCarryForward: policy.maxCarryForward,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDialog = () => {
    setEditingPolicy(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (!window.confirm("Are you sure you want to delete this leave policy?")) return;
    try {
      // Call the delete API
      await deleteLeavePolicy(parseInt(policyId));

      // Immediately remove from the current view without refetching
      setPolicies(prev => prev.filter(p => p.id !== policyId));

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
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={handleOpenDialog}>
                <Plus className="w-4 h-4" />
                Add Policy
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingPolicy ? 'Edit Leave Policy' : 'Add New Leave Policy'}</DialogTitle>
              </DialogHeader>
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxExperience">Max Experience (years)</Label>
                    <Input
                      id="maxExperience"
                      type="number"
                      min={0}
                      value={formData.maxExperience}
                      onChange={(e) => handleInputChange('maxExperience', parseInt(e.target.value) || 0)}
                    />
                    <p className="text-[10px] text-muted-foreground">Use 100 for "or more"</p>
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
                  />
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
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSubmit}>{editingPolicy ? 'Update Policy' : 'Add Policy'}</Button>
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
              {filteredPolicies.map(policy => (
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
                    {policy.minExperience}y - {policy.maxExperience >= 100 ? '100+ years' : `${policy.maxExperience}y`}
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
                      <Button variant="ghost" size="sm" onClick={() => handleEditPolicy(policy)} title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeletePolicy(policy.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-muted-foreground">
              Total Leave Policies: {totalPolicies}
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1} // Limit to calculated pages
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
