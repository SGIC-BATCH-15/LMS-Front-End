import apiClient from "./apiClient";
import { API_BASE_URL } from "@/constants/Api";
import { PrivilegeDTO } from "./privilegeService";
import { CompanyResponse } from "./companyService";

const COMPANY_PRIVILEGE_BASE_URL = `${API_BASE_URL}/company-privileges`;

export interface CompanyPrivilegeResponseDTO {
    companyId: number;
    companyName: string;
    privileges: PrivilegeDTO[];
}

export interface CompanyPrivilegeRequestDTO {
    privilegeCodes: string[];
}

export const getCompanyPrivileges = async (companyId: number): Promise<CompanyPrivilegeResponseDTO> => {
    const response = await apiClient.get(`${COMPANY_PRIVILEGE_BASE_URL}/${companyId}`);
    return response.data;
};

export const assignPrivilegesToCompany = async (companyId: number, privilegeCodes: string[]): Promise<void> => {
    const payload: CompanyPrivilegeRequestDTO = { privilegeCodes };
    await apiClient.post(`${COMPANY_PRIVILEGE_BASE_URL}/${companyId}`, payload);
};

export const removePrivilegeFromCompany = async (companyId: number, privilegeCode: string): Promise<void> => {
    await apiClient.delete(`${COMPANY_PRIVILEGE_BASE_URL}/${companyId}/${privilegeCode}`);
};

export const checkCompanyPrivilege = async (companyId: number, privilegeCode: string): Promise<boolean> => {
    const response = await apiClient.get(`${COMPANY_PRIVILEGE_BASE_URL}/${companyId}/check/${privilegeCode}`);
    return response.data.hasPrivilege;
};