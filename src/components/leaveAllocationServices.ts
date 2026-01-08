import apiClient from './services/apiClient';

interface LeaveTypeBalanceDto {
    leaveTypeId: number;
    leaveTypeName: string;
    allocatedDays: number;
    carriedForwardDays: number;
    usedDays: number;
    remainingDays: number;
}

export interface LeaveBalanceResponseDto {
    employeeId: number;
    employeeName: string;
    year: number;
    leaveBalances: LeaveTypeBalanceDto[];
}

export interface CarryForwardRequestDto {
    fromYear: number;
    toYear: number;
}

export const leaveAllocationServices = {
    // 1. Allocate Leaves
    // Endpoint: POST /api/v1/leave-allocation/allocate?year={year}
    allocateLeaves: async (year?: number): Promise<string> => {
        try {
            const params = year ? { year } : {};
            const response = await apiClient.post('/leave-allocation/allocate', null, { params });
            // Handle potentially wrapped response
            if (response.data && (response.data.data || response.data.statusMessage)) {
                return response.data.data || response.data.statusMessage;
            }
            return response.data;
        } catch (error) {
            console.error('Error allocating leaves:', error);
            throw error;
        }
    },

    // 2. Process Carry Forward
    // Endpoint: POST /api/v1/leave-allocation/carry-forward
    processCarryForward: async (data: CarryForwardRequestDto): Promise<string> => {
        try {
            const response = await apiClient.post('/leave-allocation/carry-forward', data);
            if (response.data && (response.data.data || response.data.statusMessage)) {
                return response.data.data || response.data.statusMessage;
            }
            return response.data;
        } catch (error) {
            console.error('Error processing carry forward:', error);
            throw error;
        }
    },

    // 3. Get Leave Balance by Employee ID
    // Endpoint: GET /api/v1/leave-allocation/balance/{employeeId}?year={year}
    getLeaveBalanceByEmployeeId: async (employeeId: number | string, year?: number): Promise<LeaveBalanceResponseDto> => {
        try {
            const params = year ? { year } : {};
            const response = await apiClient.get<any>(`/leave-allocation/balance/${employeeId}`, { params });

            // Handle wrapped response (common pattern in this project)
            if (response.data && response.data.leaveBalances) {
                // Direct DTO
                return response.data as LeaveBalanceResponseDto;
            } else if (response.data && response.data.data) {
                // Wrapped in ApiResponse
                return response.data.data as LeaveBalanceResponseDto;
            } else if (response.data) {
                // Fallback, assume data is the DTO
                return response.data as LeaveBalanceResponseDto;
            }

            throw new Error('Invalid response format');
        } catch (error) {
            console.error(`Error fetching balance for employee ${employeeId}:`, error);
            throw error;
        }
    },

    // 4. Get All Allocations
    // Endpoint: GET /api/v1/leave-allocation/all?year={year}
    getAllAllocations: async (year?: number): Promise<LeaveBalanceResponseDto[]> => {
        try {
            const params = year ? { year } : {};
            const response = await apiClient.get<any>('/leave-allocation/all', { params });

            if (Array.isArray(response.data)) {
                return response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                return response.data.data;
            }

            return [];
        } catch (error) {
            console.error('Error fetching all allocations:', error);
            throw error;
        }
    }
};
