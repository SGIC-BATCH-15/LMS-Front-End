import apiClient from "./apiClient";

export interface EmailConfigDTO {
    id?: number;
    displayName: string;
    sentEmail: string;
    hostName: string;
    port: number;
    protocol: string;
    password?: string;
    ccMailAddress?: string;
}

const EMAIL_API_BASE = "/settings/email";

export const emailService = {
    
    getAllEmail: async () => {
        try {
            const response = await apiClient.get(EMAIL_API_BASE);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get email configuration by ID
     */
    getEmailById: async (id: number) => {
        try {
            const response = await apiClient.get(`${EMAIL_API_BASE}/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Add new email configuration
     */
    addEmail: async (emailConfig: EmailConfigDTO) => {
        try {
            const response = await apiClient.post(`${EMAIL_API_BASE}/add`, emailConfig);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Update existing email configuration
     */
    updateEmail: async (id: number, emailConfig: EmailConfigDTO) => {
        try {
            const response = await apiClient.put(`${EMAIL_API_BASE}/${id}`, emailConfig);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
