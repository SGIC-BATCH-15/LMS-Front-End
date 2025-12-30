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

// Helper to check if a policy is truly active by fetching its details
// (Since list endpoint might return deleted items but details endpoint throws 404 for them)
const isPolicyActive = async (id: number): Promise<boolean> => {
    try {
        await apiClient.get(`${BASE_URL}/${id}`);
        return true;
    } catch (error) {
        return false;
    }
};

export const getAllLeavePolicies = async (page: number = 0, size: number = 1000) => {
    // 1. Fetch a large batch of policies (potential mix of active/deleted)
    const response = await apiClient.get<ResponseWrapper<PageResponse<BackendLeavePolicyResponse>>>(
        `${BASE_URL}?page=0&size=1000`
    );

    const allPolicies = response.data.data.content;

    // 2. Validate each policy to ensure it is not deleted
    // We check purely for explicit presence matching backend filtering logic (GET /id throws 404 if deleted)
    // or if the isDeleted flag happens to be available.

    // Optimistic check: if isDeleted flag is present and true, filter out immediately
    let candidates = allPolicies.filter((p: any) =>
        !(p.isDeleted === true || p.isDeleted === 1 || p.is_deleted === true || p.is_deleted === 1)
    );

    // 3. Strict Verification (The "Get By ID" Check)
    // If the list is reasonable size, we verify existence to be 100% sure we don't show deleted items
    // absent from the flag.
    const verificationPromises = candidates.map(async (p) => {
        const active = await isPolicyActive(p.id);
        return active ? p : null;
    });

    const verifiedResults = (await Promise.all(verificationPromises)).filter(p => p !== null) as BackendLeavePolicyResponse[];

    // 4. Client-side Pagination on the Verified List
    const totalElements = verifiedResults.length;
    const totalPages = size > 0 ? Math.ceil(totalElements / size) : 0;

    const safePage = Math.max(0, Math.min(page, totalPages > 0 ? totalPages - 1 : 0));
    const start = safePage * size;
    const end = start + size;
    const pagedContent = verifiedResults.slice(start, end);

    const modifiedResponse: ResponseWrapper<PageResponse<BackendLeavePolicyResponse>> = {
        ...response.data,
        data: {
            content: pagedContent,
            totalPages: totalPages,
            totalElements: totalElements,
            size: size,
            number: safePage
        }
    };

    return modifiedResponse;
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
