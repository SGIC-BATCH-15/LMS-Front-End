import apiClient from "./apiClient";
import { Department } from "@/types";

export interface Company {
    id: string;
    name: string;
    address: string;
    email: string;
    phoneNumber: string;
}

export const departmentService = {
    getAllCompanies: async () => {
        try {
            const response = await apiClient.get('/settings/company', {
                params: { size: 1000 } // Fetch all for dropdown
            });
            return response.data.data; // Returns Page<CompanyResponseDto>
        } catch (error) {
            throw error;
        }
    },

    getAllDepartments: async (companyId: string, page: number = 0, size: number = 1000) => {
        try {
            const response = await apiClient.get('/settings/department', {
                params: { companyId: 1, page, size },
            });
            const data = response.data.data;
            // Map backend company_id to frontend companyId
            if (data && data.content) {
                data.content = data.content.map((d: any) => ({
                    ...d,
                    companyId: d.company_id?.toString()
                }));
            }
            return data;
        } catch (error) {
            throw error;
        }
    },

    getDepartmentsByCompanyId: async (companyId: string) => {
        try {
            const response = await apiClient.get('/settings/department', {
                params: { companyId: 1, page: 0, size: 1000 },
            });
            const data = response.data.data;
            // Return just the content array
            if (data && data.content) {
                return data.content.map((d: any) => ({
                    id: d.id,
                    name: d.name,
                    companyId: d.company_id?.toString()
                }));
            }
            return [];
        } catch (error) {
            throw error;
        }
    },

    getDepartmentById: async (id: string) => {
        try {
            const response = await apiClient.get(`/settings/department/${id}`);
            const data = response.data.data;
            if (data) {
                return {
                    ...data,
                    companyId: data.company_id?.toString()
                };
            }
            return data;
        } catch (error) {
            throw error;
        }
    },

    addDepartment: async (department: Omit<Department, "id">) => {
        try {
            const payload = {
                ...department,
                company_id: 1
            };
            const response = await apiClient.post("/settings/department/add", payload);
            return response.data.data;
        } catch (error) {
            throw error;
        }
    },

    updateDepartment: async (id: string, department: Partial<Department>) => {
        try {
            const payload = {
                ...department,
                company_id: 1
            };
            const response = await apiClient.put(`/settings/department/${id}`, payload);
            return response.data.data;
        } catch (error) {
            throw error;
        }
    },

    deleteDepartment: async (id: string) => {
        try {
            const response = await apiClient.delete(`/settings/department/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
