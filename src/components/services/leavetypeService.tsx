import apiClient from "./apiClient";

export interface LeaveTypeRequestDto {
    leaveType: string;
}

export interface LeaveTypeResponseDto {
    id: number;
    leaveType: string;
}

export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

export const getAllLeaveTypes = async (page: number = 0, size: number = 10) => {
    try {
        const response = await apiClient.get<PageResponse<LeaveTypeResponseDto>>(
            `/leavemanagement/leavetype/get?page=${page}&size=${size}`
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getLeaveTypeById = async (id: number) => {
    try {
        const response = await apiClient.get<{ code: number; message: string; data: LeaveTypeResponseDto }>(
            `/leavemanagement/leavetype/${id}`
        );
        return response.data.data;
    } catch (error) {
        throw error;
    }
};

export const createLeaveType = async (data: LeaveTypeRequestDto) => {
    try {
        const response = await apiClient.post<LeaveTypeResponseDto>(
            `/leavemanagement/leavetype/add`,
            data
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateLeaveType = async (id: number, data: LeaveTypeRequestDto) => {
    try {
        const response = await apiClient.put<{ code: number; message: string; data: { leaveType: LeaveTypeResponseDto } }>(
            `/leavemanagement/leavetype/${id}`,
            data
        );
        return response.data.data.leaveType;
    } catch (error) {
        throw error;
    }
};

export const deleteLeaveType = async (id: number) => {
    try {
        const response = await apiClient.delete<{ code: number; message: string; data: null }>(
            `/leavemanagement/leavetype/${id}`
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};
