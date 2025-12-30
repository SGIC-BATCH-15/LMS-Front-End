import apiClient from "./apiClient";
import { API_BASE_URL } from "@/constants/Api";

// Employee interface for TO and CC recipients
export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

// Response interfaces
export interface LeaveTypeResponse {
  id: number;
  leaveType: string;
}

export interface LeaveRequestResponse {
  statusCode: number;
  statusMessage: string;
  data: {
    id: number;
    leaveType: LeaveTypeResponse;
    employee: Employee;
    startDate: string;
    endDate: string;
    leaveDuration: number;
    reason: string;
    status: string;
    halfDay: boolean;
    halfDayType: string | null;
    toEmail: Employee;
    ccEmails: Employee[];
    createdAt: string;
    updatedAt: string;
  };
}

// Leave Request Item (for list)
export interface LeaveRequestItem {
  id: number;
  leaveType: LeaveTypeResponse;
  employee: Employee;
  startDate: string;
  endDate: string;
  leaveDuration: number;
  reason: string;
  status: string;
  halfDay: boolean;
  halfDayType: string | null;
  toEmail: Employee;
  ccEmails: Employee[];
  createdAt: string;
  updatedAt: string;
}

// Response for fetching all leave requests
export interface AllLeaveRequestsResponse {
  statusCode: number;
  statusMessage: string;
  data: LeaveRequestItem[];
}

// Request payload interface
export interface CreateLeaveRequestPayload {
  leaveTypeId: number;
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
  reason: string;
  halfDay: boolean;
  halfDayType?: "MORNING" | "AFTERNOON" | null;
  toEmailEmployeeId: number;
  ccEmailEmployeeIds: number[];
}

const LEAVE_MANAGEMENT_BASE = `${API_BASE_URL}/leavemanagement`;

/**
 * Fetch TO recipient email based on logged-in user's role and company configuration
 */
export const fetchToRecipient = async (): Promise<Employee[]> => {
  try {
    const response = await apiClient.get(
      `${LEAVE_MANAGEMENT_BASE}/notification-config/to-recipient`
    );
    
    console.log("TO Recipients Response:", response.data);
    
    const responseData = response.data;
    
    // Handle statusCode wrapper
    if (responseData?.statusCode && responseData?.data) {
      const data = responseData.data;
      
      // If data is a single Employee object, wrap in array
      if (data && typeof data === 'object' && data.id) {
        console.log("TO Recipient (Employee object):", [data]);
        return [data];
      }
      // If data is an array of Employee objects
      else if (Array.isArray(data) && data.length > 0) {
        console.log("TO Recipients (Employee array):", data);
        return data;
      }
    }
    
    // Direct Employee object
    if (responseData && typeof responseData === 'object' && responseData.id) {
      console.log("TO Recipient (direct object):", [responseData]);
      return [responseData];
    }
    
    // Direct array of Employee objects
    if (Array.isArray(responseData) && responseData.length > 0) {
      console.log("TO Recipients (direct array):", responseData);
      return responseData;
    }
    
    console.log("TO Recipients: No valid data found");
    return [];
  } catch (error: any) {
    console.error("Error fetching TO recipient:", error);
    console.error("Error response:", error.response?.data);
    return [];
  }
};

/**
 * Fetch CC email recipients based on logged-in user's role and company configuration
 */
export const fetchCcEmails = async (): Promise<Employee[]> => {
  try {
    const response = await apiClient.get(
      `${LEAVE_MANAGEMENT_BASE}/leaverequest/cc-email`
    );
    
    console.log("CC Recipients Response:", response.data);
    
    const responseData = response.data;
    
    // Handle statusCode wrapper
    if (responseData?.statusCode && responseData?.data) {
      const data = responseData.data;
      
      // If data is an array of Employee objects
      if (Array.isArray(data)) {
        console.log("CC Recipients (Employee array):", data);
        return data;
      }
      // If data is a single Employee object
      else if (data && typeof data === 'object' && data.id) {
        console.log("CC Recipient (Single Employee):", [data]);
        return [data];
      }
    }
    
    // Direct array of Employee objects
    if (Array.isArray(responseData)) {
      console.log("CC Recipients (direct array):", responseData);
      return responseData;
    }
    
    console.log("CC Recipients: No valid data found");
    return [];
  } catch (error: any) {
    console.error("Error fetching CC emails:", error);
    console.error("Error response:", error.response?.data);
    return [];
  }
};

/**
 * Submit a new leave request
 */
export const createLeaveRequest = async (
  payload: CreateLeaveRequestPayload
): Promise<LeaveRequestResponse> => {
  try {
    console.log("=== Sending Leave Request ===");
    console.log("Payload:", payload);
    
    const response = await apiClient.post<LeaveRequestResponse>(
      `${LEAVE_MANAGEMENT_BASE}/leaverequest/add`,
      payload
    );
    
    console.log("=== Leave Request Response ===");
    console.log("Response:", response.data);
    
    return response.data;
  } catch (error: any) {
    console.error("Error creating leave request:", error);
    console.error("Error response data:", error.response?.data);
    console.error("Error status:", error.response?.status);
    throw error;
  }
};

/**
 * Fetch all leave requests for the logged-in employee
 */
export const getAllLeaveRequests = async (): Promise<LeaveRequestItem[]> => {
  try {
    const response = await apiClient.get(
      `${LEAVE_MANAGEMENT_BASE}/leaverequest`
    );
    
    console.log("All Leave Requests Response:", response.data);
    
    const responseData = response.data;
    
    // Handle statusCode wrapper
    if (responseData?.statusCode && responseData?.data) {
      const data = responseData.data;
      
      // If data is an array of leave requests
      if (Array.isArray(data)) {
        console.log("Leave Requests (array):", data);
        return data;
      }
    }
    
    // Direct array
    if (Array.isArray(responseData)) {
      console.log("Leave Requests (direct array):", responseData);
      return responseData;
    }
    
    console.log("Leave Requests: No valid data found");
    return [];
  } catch (error: any) {
    console.error("Error fetching leave requests:", error);
    console.error("Error response:", error.response?.data);
    return [];
  }
};

/**
 * Delete a leave request by ID
 */
export const deleteLeaveRequest = async (leaveRequestId: number): Promise<void> => {
  try {
    const response = await apiClient.delete(
      `${LEAVE_MANAGEMENT_BASE}/leaverequest/${leaveRequestId}`
    );
    
    console.log("Delete Leave Request Response:", response.data);
  } catch (error: any) {
    console.error("Error deleting leave request:", error);
    console.error("Error response:", error.response?.data);
    throw error;
  }
};
