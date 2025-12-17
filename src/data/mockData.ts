import { Department, User, LeavePolicy, LeaveBalance, LeaveRequest, Notification } from '@/types';

export const departments: Department[] = [
  { id: 'dept-1', name: 'Engineering', companyId: '1' },
  { id: 'dept-2', name: 'Human Resources', companyId: '1' },
  { id: 'dept-3', name: 'Marketing', companyId: '2' },
  { id: 'dept-4', name: 'Finance', companyId: '2' },
];

export const users: User[] = [
  {
    id: 'user-1',
    name: 'Sarah Johnson',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah@company.com',
    password: 'password123',
    role: 'admin',
    departmentId: 'dept-2',
    designation: 'HR Director',
    joinDate: '2020-01-15',
    currentExperience: 5,
    previousExperience: 8,
  },
  {
    id: 'user-2',
    name: 'Michael Chen',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael@company.com',
    password: 'password123',
    role: 'manager',
    departmentId: 'dept-1',
    designation: 'Engineering Manager',
    joinDate: '2021-03-10',
    currentExperience: 4,
    previousExperience: 6,
  },
  {
    id: 'user-3',
    name: 'Emily Davis',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily@company.com',
    password: 'password123',
    role: 'manager',
    departmentId: 'dept-2',
    designation: 'HR Manager',
    joinDate: '2022-06-01',
    currentExperience: 3,
    previousExperience: 4,
  },
  {
    id: 'user-4',
    name: 'James Wilson',
    firstName: 'James',
    lastName: 'Wilson',
    email: 'james@company.com',
    password: 'password123',
    role: 'manager',
    departmentId: 'dept-3',
    designation: 'Marketing Lead',
    joinDate: '2023-01-20',
    currentExperience: 2,
    previousExperience: 5,
  },
  {
    id: 'user-5',
    name: 'Lisa Anderson',
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: 'lisa@company.com',
    password: 'password123',
    role: 'manager',
    departmentId: 'dept-4',
    designation: 'Finance Manager',
    joinDate: '2019-11-05',
    currentExperience: 6,
    previousExperience: 4,
  },
  {
    id: 'user-6',
    name: 'Alex Thompson',
    firstName: 'Alex',
    lastName: 'Thompson',
    email: 'alex@company.com',
    password: 'password123',
    role: 'staff',
    departmentId: 'dept-1',
    designation: 'Frontend Developer',
    joinDate: '2023-08-15',
    currentExperience: 2,
    previousExperience: 3,
    managerId: 'user-2',
  },
  {
    id: 'user-7',
    name: 'Rachel Green',
    firstName: 'Rachel',
    lastName: 'Green',
    email: 'rachel@company.com',
    password: 'password123',
    role: 'staff',
    departmentId: 'dept-1',
    designation: 'Backend Developer',
    joinDate: '2024-02-01',
    currentExperience: 1,
    previousExperience: 2,
    managerId: 'user-2',
  },
  {
    id: 'user-8',
    name: 'David Kim',
    firstName: 'David',
    lastName: 'Kim',
    email: 'david@company.com',
    password: 'password123',
    role: 'staff',
    departmentId: 'dept-3',
    designation: 'Content Writer',
    joinDate: '2024-05-20',
    currentExperience: 1,
    previousExperience: 1,
    managerId: 'user-4',
  },
];

export const leavePolicies: LeavePolicy[] = [
  // Annual Leave - Tiered by Experience
  { id: 'policy-1', leaveType: 'annual', minExperience: 0, maxExperience: 2, daysAllowed: 12, carryForward: false, maxCarryForward: 0 },
  { id: 'policy-2', leaveType: 'annual', minExperience: 2, maxExperience: 5, daysAllowed: 15, carryForward: true, maxCarryForward: 5 },
  { id: 'policy-3', leaveType: 'annual', minExperience: 5, maxExperience: 100, daysAllowed: 20, carryForward: true, maxCarryForward: 10 },

  // Casual Leave - Flat rate
  { id: 'policy-4', leaveType: 'casual', minExperience: 0, maxExperience: 100, daysAllowed: 12, carryForward: false, maxCarryForward: 0 },

  // Sick Leave - Flat rate
  { id: 'policy-5', leaveType: 'sick', minExperience: 0, maxExperience: 100, daysAllowed: 10, carryForward: false, maxCarryForward: 0 },

  // Maternity/Paternity
  { id: 'policy-6', leaveType: 'maternity', minExperience: 0, maxExperience: 100, daysAllowed: 84, carryForward: false, maxCarryForward: 0 },
  { id: 'policy-7', leaveType: 'paternity', minExperience: 0, maxExperience: 100, daysAllowed: 14, carryForward: false, maxCarryForward: 0 },
];

export const leaveBalances: LeaveBalance[] = [
  // Alex Thompson (staff) balances
  { id: 'bal-1', userId: 'user-6', leaveType: 'annual', total: 15, used: 5, pending: 2, year: 2025 },
  { id: 'bal-2', userId: 'user-6', leaveType: 'casual', total: 8, used: 2, pending: 0, year: 2025 },
  { id: 'bal-3', userId: 'user-6', leaveType: 'sick', total: 10, used: 1, pending: 0, year: 2025 },
  // Michael Chen (manager) balances
  { id: 'bal-4', userId: 'user-2', leaveType: 'annual', total: 22, used: 8, pending: 0, year: 2025 },
  { id: 'bal-5', userId: 'user-2', leaveType: 'casual', total: 10, used: 3, pending: 1, year: 2025 },
  { id: 'bal-6', userId: 'user-2', leaveType: 'sick', total: 12, used: 0, pending: 0, year: 2025 },
  // Sarah Johnson (admin) balances
  { id: 'bal-7', userId: 'user-1', leaveType: 'annual', total: 25, used: 10, pending: 0, year: 2025 },
  { id: 'bal-8', userId: 'user-1', leaveType: 'casual', total: 12, used: 4, pending: 0, year: 2025 },
  { id: 'bal-9', userId: 'user-1', leaveType: 'sick', total: 15, used: 2, pending: 0, year: 2025 },
];

export const leaveRequests: LeaveRequest[] = [
  {
    id: 'req-1',
    employeeId: 'user-6',
    employeeName: 'Alex Thompson',
    leaveType: 'annual',
    startDate: '2025-01-15',
    endDate: '2025-01-17',
    days: 3,
    reason: 'Family vacation planned for the long weekend. Will be traveling to visit parents.',
    status: 'pending',
    toRecipients: ['user-1'],
    ccRecipients: ['user-2'],
    approvalSteps: [
      { id: 'step-1', approverId: 'user-2', approverName: 'Michael Chen', approverRole: 'Team Lead', status: 'approved', comment: 'Approved. Enjoy your vacation!', actionDate: '2025-01-10', order: 1 },
      { id: 'step-2', approverId: 'user-1', approverName: 'Sarah Johnson', approverRole: 'HR Director', status: 'pending', order: 2 },
    ],
    currentStep: 2,
    createdAt: '2025-01-08T09:00:00Z',
    updatedAt: '2025-01-10T14:30:00Z',
  },
  {
    id: 'req-2',
    employeeId: 'user-7',
    employeeName: 'Rachel Green',
    leaveType: 'sick',
    startDate: '2025-01-12',
    endDate: '2025-01-12',
    days: 1,
    reason: 'Not feeling well, need to rest and recover.',
    status: 'approved',
    toRecipients: ['user-1'],
    ccRecipients: ['user-2'],
    approvalSteps: [
      { id: 'step-3', approverId: 'user-2', approverName: 'Michael Chen', approverRole: 'Team Lead', status: 'approved', comment: 'Get well soon!', actionDate: '2025-01-11', order: 1 },
      { id: 'step-4', approverId: 'user-1', approverName: 'Sarah Johnson', approverRole: 'HR Director', status: 'approved', comment: 'Approved', actionDate: '2025-01-11', order: 2 },
    ],
    currentStep: 2,
    createdAt: '2025-01-11T08:00:00Z',
    updatedAt: '2025-01-11T11:00:00Z',
  },
  {
    id: 'req-3',
    employeeId: 'user-6',
    employeeName: 'Alex Thompson',
    leaveType: 'casual',
    startDate: '2025-02-20',
    endDate: '2025-02-21',
    days: 2,
    reason: 'Personal errands and appointments.',
    status: 'pending',
    toRecipients: ['user-1'],
    ccRecipients: ['user-2'],
    approvalSteps: [
      { id: 'step-5', approverId: 'user-2', approverName: 'Michael Chen', approverRole: 'Team Lead', status: 'pending', order: 1 },
      { id: 'step-6', approverId: 'user-1', approverName: 'Sarah Johnson', approverRole: 'HR Director', status: 'pending', order: 2 },
    ],
    currentStep: 1,
    createdAt: '2025-02-15T10:00:00Z',
    updatedAt: '2025-02-15T10:00:00Z',
  },
];

export const notifications: Notification[] = [
  { id: 'notif-1', userId: 'user-6', title: 'Leave Approved', message: 'Your annual leave request has been approved by Michael Chen.', type: 'success', read: false, createdAt: '2025-01-10T14:30:00Z' },
  { id: 'notif-2', userId: 'user-2', title: 'New Leave Request', message: 'Alex Thompson has submitted a new leave request for your approval.', type: 'info', read: false, createdAt: '2025-02-15T10:00:00Z' },
  { id: 'notif-3', userId: 'user-1', title: 'Pending Approval', message: 'A leave request from Alex Thompson is waiting for your final approval.', type: 'warning', read: true, createdAt: '2025-01-10T14:30:00Z' },
];

export const currentUser = users[5]; // Alex Thompson (staff) for demo
