export type UserRole = 'admin' | 'manager' | 'staff' | 'employee';

export type LeaveType = 'annual' | 'casual' | 'sick' | 'maternity' | 'paternity' | 'unpaid';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Department {
  id: string;
  name: string;
  companyId: string;
}

export interface User {
  id: string;
  name: string; // Keeps full name for compatibility
  firstName: string;
  lastName: string;
  email: string;
  password?: string; // Added for User Creation mock
  role: UserRole;
  departmentId: string;
  companyId?: string; // Added for filtering
  designation: string;
  joinDate: string; // ISO Date string
  currentExperience: number; // Derived or stored
  previousExperience: number; // Input
  managerId?: string;
  avatar?: string;
}

export interface LeavePolicy {
  id: string;
  leaveType: LeaveType;
  minExperience: number;
  maxExperience: number;
  daysAllowed: number;
  carryForward: boolean;
  maxCarryForward: number;
}

export interface LeaveBalance {
  id: string;
  userId: string;
  leaveType: LeaveType;
  total: number;
  used: number;
  pending: number;
  year: number;
}

export interface ApprovalStep {
  id: string;
  approverId: string;
  approverName: string;
  approverRole: string;
  status: ApprovalStatus;
  comment?: string;
  actionDate?: string;
  order: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  toRecipients: string[];
  ccRecipients: string[];
  approvalSteps: ApprovalStep[];
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  permissions: {
    canApprove: boolean;
    canReject: boolean;
    canCancel: boolean;
  };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: Date;
  companyId: string;
  type: 'public' | 'restricted';
}

export interface WeeklyOff {
  id: string;
  companyId: string;
  days: number[]; // 0 = Sunday, 1 = Monday, etc.
}
