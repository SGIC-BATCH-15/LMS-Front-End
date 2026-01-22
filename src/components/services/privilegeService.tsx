import apiClient from "./apiClient";
import { API_BASE_URL } from "@/constants/Api";

export interface PrivilegeDTO {
    id: number;
    name: string;
    code: string;
    description: string;
    category: string;
}

const PRIVILEGE_BASE_URL = `${API_BASE_URL}/privileges`;

export const getAllPrivileges = async (): Promise<PrivilegeDTO[]> => {
    const response = await apiClient.get(PRIVILEGE_BASE_URL);
    return response.data;
};

export const getPrivilegeByCode = async (code: string): Promise<PrivilegeDTO> => {
    const response = await apiClient.get(`${PRIVILEGE_BASE_URL}/${code}`);
    return response.data;
};
