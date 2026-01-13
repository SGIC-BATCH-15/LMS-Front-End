import apiClient from "./apiClient";

// --- Interfaces ---

export interface LeaveTypeBalance {
    leaveTypeId: number;
    leaveTypeName: string;
    allocatedDays: number;
    carriedForwardDays: number;
    usedDays: number;
    remainingDays: number;
}

export interface LeaveBalanceResponse {
    employeeId: number;
    employeeName: string;
    year: number;
    leaveBalances: LeaveTypeBalance[];
}

export interface EmployeeInfo {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
}

export interface LeaveTypeInfo {
    id: number;
    leaveType: string;
}

export interface LeaveRequestResponse {
    id: number;
    leaveType: LeaveTypeInfo;
    employee: EmployeeInfo;
    startDate: string;
    endDate: string;
    leaveDuration: number;
    reason: string;
    status: string;
    halfDay: boolean;
    halfDayType: string | null;
    toEmail: EmployeeInfo;
    ccEmails: EmployeeInfo[];
    createdAt: string;
    updatedAt: string;
    // Frontend specific helpers if needed later, but backend returns these fields
}

// Wrapper types
interface ResponseWrapper<T> {
    statusCode: number;
    message: string;
    data: T;
}

// --- Dashboard Stats ---

export const getPendingRequestsCount = async (status: string) => {
    const response = await apiClient.get<ResponseWrapper<number>>(`/dashboard/calculatePendingRequest/${status}`);
    return response.data.data;
};

export const getTotalLeaveTaken = async () => {
    const response = await apiClient.get<ResponseWrapper<number>>('/dashboard/calculateLeaveTaken');
    return response.data.data;
};

export const getRejectedRequestsCount = async () => {
    const response = await apiClient.get<ResponseWrapper<number>>(`/dashboard/calculateReject/REJECTED`);
    return response.data.data;
};

// --- Other Data ---

export const getMyLeaveBalance = async () => {
    // LeaveAllocationController returns the DTO directly, not wrapped
    const response = await apiClient.get<LeaveBalanceResponse>(`/leave-allocation/balance/me`);
    return response.data;
};

export const getAllLeaveRequests = async () => {
    // LeaveRequestController returns wrapped list
    const response = await apiClient.get<ResponseWrapper<LeaveRequestResponse[]>>(`/leavemanagement/leaverequest`);
    return response.data.data;
};

export const getPendingApprovals = async () => {
    // LeaveApprovalController returns list directly, not wrapped
    const response = await apiClient.get<LeaveRequestResponse[]>(`/leave/approvals/pending`);
    return response.data;
};
