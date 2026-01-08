import apiClient from "./apiClient";
import { API_BASE_URL } from "@/constants/Api";

// Leave Balance Item for each leave type
export interface LeaveBalanceItem {
  leaveTypeId: number;
  leaveTypeName: string;
  allocatedDays: number;
  carriedForwardDays: number;
  usedDays: number;
  remainingDays: number;
}

// API Response structure
export interface LeaveBalanceResponse {
  employeeId: number;
  employeeName: string;
  year: number;
  leaveBalances: LeaveBalanceItem[];
}

// Service to get leave balance for the logged-in user
export const getMyLeaveBalance = async (): Promise<LeaveBalanceResponse> => {
  try {
    const response = await apiClient.get<LeaveBalanceResponse>(
      `${API_BASE_URL}/leave-allocation/balance/me`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching leave balance:", error);
    throw error;
  }
};
