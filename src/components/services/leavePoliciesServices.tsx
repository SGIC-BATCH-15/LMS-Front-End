import apiClient from "./apiClient";
import { LeaveTypeResponseDto } from "./leavetypeService";

export interface BackendLeavePolicyResponse {
    id: number;
    leaveType: LeaveTypeResponseDto;
    minExperience: number;
    maxExperience: number;
    daysAllowed: number;
    carryForwardAllowed: boolean;
    maxCarryForwardDays: number;
    createdAt: string;
    updatedAt: string;
    isDeleted?: boolean;
}

export interface BackendLeavePolicyRequest {
    leaveTypeId: number;
    minExperience: number;
    maxExperience: number;
    daysAllowed: number;
    carryForwardAllowed: boolean;
    maxCarryForwardDays: number;
}

export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

export interface ResponseWrapper<T> {
    statusCode: number;
    statusMessage: string;
    data: T;
}

const BASE_URL = "/settings/leavepolicy";

export const getAllLeavePolicies = async (page: number = 0, size: number = 1000) => {
    const response = await apiClient.get<ResponseWrapper<PageResponse<BackendLeavePolicyResponse>>>(
        `${BASE_URL}?page=${page}&size=${size}`
    );
    return response.data;
};

export const getLeavePolicyById = async (id: number) => {
    const response = await apiClient.get<ResponseWrapper<BackendLeavePolicyResponse>>(
        `${BASE_URL}/${id}`
    );
    return response.data;
};

export const addLeavePolicy = async (data: BackendLeavePolicyRequest) => {
    const response = await apiClient.post<ResponseWrapper<BackendLeavePolicyResponse>>(
        `${BASE_URL}/add`,
        data
    );
    return response.data;
};

export const updateLeavePolicy = async (id: number, data: BackendLeavePolicyRequest) => {
    const response = await apiClient.put<ResponseWrapper<BackendLeavePolicyResponse>>(
        `${BASE_URL}/${id}`,
        data
    );
    return response.data;
};

export const deleteLeavePolicy = async (id: number) => {
    const response = await apiClient.delete<ResponseWrapper<null>>(
        `${BASE_URL}/${id}`
    );
    return response.data;
};
