import { UserRole } from '@/types';

export interface Permission {
    id: string;
    name: string;
    description: string;
}

export const permissions: Permission[] = [
    { id: 'view_dashboard', name: 'View Dashboard', description: 'Access to dashboard and statistics' },
    { id: 'apply_leave', name: 'Apply Leave', description: 'Submit leave requests' },
    { id: 'view_own_leaves', name: 'View Own Leaves', description: 'View personal leave history' },
    { id: 'approve_leaves', name: 'Approve Leaves', description: 'Approve or reject leave requests' },
    { id: 'view_team_leaves', name: 'View Team Leaves', description: 'View team members leave status' },
    { id: 'manage_employees', name: 'Manage Employees', description: 'Add, edit, or remove employees' },
    { id: 'manage_departments', name: 'Manage Departments', description: 'Manage department structure' },
    { id: 'manage_roles', name: 'Manage Roles', description: 'Configure role permissions' },
    { id: 'manage_leave_types', name: 'Manage Leave Types', description: 'Create and configure leave types' },
    { id: 'manage_policies', name: 'Manage Leave Policies', description: 'Configure leave policies and rules' },
    { id: 'view_reports', name: 'View Reports', description: 'Access analytics and reports' },
    { id: 'system_settings', name: 'System Settings', description: 'Configure system-wide settings' },
    { id: 'manage_designations', name: 'Manage Designations', description: 'Manage employee designations' },
];

export const defaultRolePermissions: Record<UserRole, Set<string>> = {
    staff: new Set(['view_dashboard', 'apply_leave', 'view_own_leaves']),
    employee: new Set(['view_dashboard', 'apply_leave', 'view_own_leaves']),
    manager: new Set([
        'view_dashboard',
        'apply_leave',
        'view_own_leaves',
        'approve_leaves',
        'view_team_leaves',
        'view_reports',
    ]),
    admin: new Set(permissions.map(p => p.id)),
};
