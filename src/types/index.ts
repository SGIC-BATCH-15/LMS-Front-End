export type UserRole = 'admin' | 'manager' | 'staff' | 'employee';

export type LeaveType = 'annual' | 'casual' | 'sick' | 'maternity' | 'paternity' | 'unpaid';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// Login related types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  statusCode: number;
  statusMessage: string;
  data: {
    accessToken: string;
    expiresIn: number;
  };
}

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
  roleIds?: number[]; // Store roleIds from backend for editing
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

// Backend Employee interface for API integration
export interface BackendEmployee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

// Backend Leave Type interface
export interface BackendLeaveType {
  id: number;
  leaveType: string;
}

// Backend Leave Request Payload
export interface BackendLeaveRequestPayload {
  leaveTypeId: number;
  employeeId: number;
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
  leaveDuration: number;
  reason: string;
  halfDay: boolean;
  halfDayType?: "MORNING" | "AFTERNOON" | null;
  toEmailEmployeeId: number;
  ccEmailEmployeeIds: number[];
}

// Backend Leave Request Response
export interface BackendLeaveRequestResponse {
  statusCode: number;
  statusMessage: string;
  data: {
    id: number;
    leaveType: BackendLeaveType;
    employee: BackendEmployee;
    startDate: string;
    endDate: string;
    leaveDuration: number;
    reason: string;
    status: string;
    halfDay: boolean;
    halfDayType: string | null;
    toEmail: BackendEmployee;
    ccEmails: BackendEmployee[];
    createdAt: string;
    updatedAt: string;
  };
}