// src/services/leaveNotificationService.ts  (recommended location & name)

import apiClient from './apiClient';

// For demo mode this service uses the shared mock apiClient.
// If you need raw URL support, disable DEMO_MODE in apiClient.tsx.

// Types matching your backend DTOs
interface CcConfiguration {
  forRoleId: number;
  ccRoleIds: number[];
}

interface LeaveNotificationConfigRequest {
  companyId: number;
  toRoleId: number;
  ccConfigurations: CcConfiguration[];
}

interface CcConfigForSingleRoleRequest {
  companyId: number;
  toRoleId: number;
  forRoleId: number;
  ccRoleIds: number[];
}

/**
 * Save or update the full leave notification configuration
 * Uses: POST /api/v1/leavemanagement/notification-config/add
 */
export const saveLeaveNotificationConfig = async (
  data: LeaveNotificationConfigRequest
) => {
  try {
    const response = await apiClient.post(
      `/leavemanagement/notification-config/add`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to save leave notification config:', error);
    throw error.response?.data || error.message || error;
  }
};

/**
 * Add or update CC configuration for a single role only
 * Useful if you want incremental updates instead of full overwrite
 * Uses: POST /api/v1/leavemanagement/notification-config/cc-config/role
 */
export const updateCcConfigForRole = async (
  data: CcConfigForSingleRoleRequest
) => {
  try {
    const response = await apiClient.post(
      `/leavemanagement/notification-config/cc-config/role`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to update CC config for role:', error);
    throw error.response?.data || error.message || error;
  }
};