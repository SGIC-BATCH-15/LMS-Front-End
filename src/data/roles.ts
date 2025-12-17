import { UserRole } from '@/types';

export interface Role {
    id: string;
    name: string;
    key: UserRole | string; // key matches UserRole type for default roles
    description: string;
    color: string;
    isSystem?: boolean; // System roles cannot be deleted
    companyId?: string;
    departmentId?: string;
}

export const roles: Role[] = [
    {
        id: '1',
        name: 'Admin',
        key: 'admin',
        description: 'Full system access',
        color: 'bg-red-500',
        isSystem: true
    },
    {
        id: '2',
        name: 'Manager',
        key: 'manager',
        description: 'Team and approval management',
        color: 'bg-blue-500',
        isSystem: true
    },
    {
        id: '3',
        name: 'Staff',
        key: 'staff',
        description: 'Basic employee access',
        color: 'bg-green-500',
        isSystem: true
    },
    {
        id: '4',
        name: 'Employee',
        key: 'employee',
        description: 'Standard employee access',
        color: 'bg-purple-500',
        isSystem: true
    },
];
