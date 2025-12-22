import apiClient from "./apiClient";

// Define the interface to match the Backend Entity strictly
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

// API base path: /settings/email
// apiClient has base URL /api/v1, so we append /settings/email
const EMAIL_API_BASE = "/settings/email";

export const emailService = {
    /**
     * Get all email configurations
     */
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
