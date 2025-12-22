export type Role = 'Manager' | 'QA' | 'HR' | 'Staff' | 'Team Lead' | 'Project Manager';

export interface NotificationRule {
    requesterRole: Role;
    allowedCCRoles: Role[];
}

export const availableRoles: Role[] = ['Manager', 'QA', 'HR', 'Staff', 'Team Lead', 'Project Manager'];

export const initialNotificationRules: NotificationRule[] = [
    {
        requesterRole: 'Manager',
        allowedCCRoles: ['QA', 'HR'],
    },
    {
        requesterRole: 'QA',
        allowedCCRoles: ['Manager', 'HR'],
    },
    {
        requesterRole: 'HR',
        allowedCCRoles: ['Manager', 'QA'],
    },
    {
        requesterRole: 'Staff',
        allowedCCRoles: ['Team Lead', 'Project Manager'],
    },
    {
        requesterRole: 'Team Lead',
        allowedCCRoles: ['Project Manager', 'HR'],
    },
    {
        requesterRole: 'Project Manager',
        allowedCCRoles: ['HR', 'Manager'],
    },
];
