import apiClient from "./apiClient";
import { API_BASE_URL } from "@/constants/Api";
import { CompanyPrivilegeResponseDTO } from "./CompanyPrivilegeService";

const COMPANY_PRIVILEGE_BASE_URL = `${API_BASE_URL}/company-privileges`;

/**
 * Fetches the privileges assigned to the current user's company.
 * Uses the /mine endpoint to avoid exposing company ID or checking other companies.
 */
export const getMyCompanyPrivileges = async (): Promise<CompanyPrivilegeResponseDTO> => {
    const response = await apiClient.get(`${COMPANY_PRIVILEGE_BASE_URL}/mine`);
    return response.data;
};