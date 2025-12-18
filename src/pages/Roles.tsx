import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/templates/DashboardLayout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { Role } from "@/data/roles";
import { roleService } from "@/components/services/roleService";

export const Roles: React.FC = () => {

  const [roles1, setRoles1] = useState<Role[]>([]); // paginated roles from API
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [page, setPage] = useState(1); // UI page starts at 1
  const [size, setSize] = useState(5); // Requirement: Max 5 items per page
  const [totalPages, setTotalPages] = useState(1);

  // Filter roles based on search
  const filteredRoles = roles1.filter((role) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch paginated roles whenever page or size changes
  useEffect(() => {
    fetchRoles(page, size);
  }, [page, size]);

  const fetchRoles = async (page: number, size: number) => {
    try {
      // Backend uses 0-based indexing, so subtract 1 from UI page
      const res = await roleService.getRoles(page - 1, size);
      console.log("Full API Response:", res);

      // API structure: res is ResponseWrapper, res.data is RolePaginationDto
      // detailed check: response.data in axios is the body. 
      // roleService.getRoles returns response.data (Body).
      // Body is { statusCode, message, data: { roles, ... } }
      // So res.data is the pagination object.

      const responseData = res.data; // RolePaginationDto
      if (responseData && responseData.roles) {
        setRoles1(responseData.roles);
        setTotalPages(responseData.totalPages);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Pagination handlers
  const handleNext = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const handlePrev = () => {
    if (page > 1) setPage(page - 1);
  };

  // Dialog handlers
  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({ name: role.name });
    } else {
      setEditingRole(null);
      setFormData({ name: "" });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRole(null);
    setFormData({ name: "" });
  };

  // Save handler for add/edit
  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Please enter a role name");
      return;
    }

    try {
      if (editingRole) {
        // Update existing role
        await roleService.updateRole(Number(editingRole.id), { name: formData.name });
        toast.success("Role updated successfully");
      } else {
        // Create new role
        await roleService.createRole({ name: formData.name });
        toast.success("Role added successfully");
      }

      handleCloseDialog();
      // Refresh the roles list
      await fetchRoles(page, size);
    } catch (error: any) {
      console.error("Error saving role:", error);
      const errorMessage = error.response?.data?.message || "Failed to save role. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Delete handler
  const handleDelete = async (role: Role) => {
    if (
      window.confirm(`Are you sure you want to delete the role "${role.name}"?`)
    ) {
      try {
        await roleService.deleteRole(Number(role.id));
        toast.success("Role deleted successfully");
        // Refresh the roles list
        await fetchRoles(page, size);
      } catch (error: any) {
        console.error("Error deleting role:", error);
        const errorMessage = error.response?.data?.message || "Failed to delete role. Please try again.";
        toast.error(errorMessage);
      }
    }
  };

  return (
    <DashboardLayout title="Role Management" subtitle="Manage user roles">
      <div className="space-y-6">
        {/* Header with Add Button */}
        <div className="flex justify-between items-center">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Role
          </Button>
        </div>

        {/* Roles Table */}
        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="text-center text-muted-foreground"
                  >
                    No roles found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${role.color}`} />
                        {role.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(role)}
                          title="Edit role"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(role)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete role"
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

        {/* Pagination Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={handlePrev} disabled={page === 1}>
            Prev
          </Button>
          <span className="px-2">
            Page {page} of {totalPages}
          </span>
          <Button onClick={handleNext} disabled={page >= totalPages}>
            Next
          </Button>
        </div>

        {/* Add/Edit Role Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingRole ? "Edit Role" : "Add Role"}
              </DialogTitle>
              <DialogDescription>
                {editingRole
                  ? "Update role name"
                  : "Enter name for the new role"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Role Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Supervisor"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingRole ? "Update" : "Create"} Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};
