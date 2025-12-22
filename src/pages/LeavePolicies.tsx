import React, { useState } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { leavePolicies as initialPolicies } from '@/data/mockData';
import { LeaveTypeBadge } from '@/components/atoms/Badge/LeaveTypeBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { LeavePolicy, LeaveType } from '@/types';

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

export const LeavePolicies: React.FC = () => {
  const [filterType, setFilterType] = useState('all');
  const [policies, setPolicies] = useState<LeavePolicy[]>(initialPolicies);
  const [formData, setFormData] = useState<PolicyFormData>(initialFormData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);

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

  const handleSubmit = () => {
    if (editingPolicy) {
      // Update existing policy
      const updatedPolicy: LeavePolicy = {
        ...editingPolicy,
        leaveType: formData.leaveType,
        minExperience: formData.minExperience,
        maxExperience: formData.maxExperience,
        daysAllowed: formData.daysAllowed,
        carryForward: formData.carryForward,
        maxCarryForward: formData.carryForward ? formData.maxCarryForward : 0,
      };

      setPolicies(prev => prev.map(p => p.id === editingPolicy.id ? updatedPolicy : p));
    } else {
      // Create new policy
      const newPolicy: LeavePolicy = {
        id: `policy-${Date.now()}`,
        leaveType: formData.leaveType,
        minExperience: formData.minExperience,
        maxExperience: formData.maxExperience,
        daysAllowed: formData.daysAllowed,
        carryForward: formData.carryForward,
        maxCarryForward: formData.carryForward ? formData.maxCarryForward : 0,
      };
      setPolicies(prev => [...prev, newPolicy]);
    }

    setFormData(initialFormData);
    setIsDialogOpen(false);
    setEditingPolicy(null);
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

  const handleDeletePolicy = (policyId: string) => {
    setPolicies(prev => prev.filter(policy => policy.id !== policyId));
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
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="sick">Sick</SelectItem>
                <SelectItem value="maternity">Maternity</SelectItem>
                <SelectItem value="paternity">Paternity</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
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
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="sick">Sick</SelectItem>
                      <SelectItem value="maternity">Maternity</SelectItem>
                      <SelectItem value="paternity">Paternity</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPolicies.map(policy => (
                <TableRow key={policy.id}>
                  <TableCell>
                    <LeaveTypeBadge type={policy.leaveType} size="sm" />
                  </TableCell>
                  {/* Role cell removed */}
                  <TableCell>
                    {policy.minExperience}y - {policy.maxExperience >= 100 ? '∞' : `${policy.maxExperience}y`}
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
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
        </div>
      </div>
    </DashboardLayout>
  );
};
