// src/services/leaveNotificationService.ts  (recommended location & name)

import axios from 'axios';

// Adjust this import based on where your API_BASE_URL is defined
// Common locations:
// - src/constants/Api.ts
// - src/config/api.ts
// - src/utils/api.ts
// If you're using a file named Api.ts with export const API_BASE_URL = "..."
import { API_BASE_URL } from '@/constants/Api'; // Most common with Vite + @ alias
// OR try these if the above doesn't work:
// import { API_BASE_URL } from '@/config/Api';
// import { API_BASE_URL } from '@/utils/Api';
// import { API_BASE_URL } from '../constants/Api';

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
    const response = await axios.post(
      `${API_BASE_URL}/leavemanagement/notification-config/add`,
      data
    );
    return response.data;
  } catch (error: any) {
    // Improved error handling — re-throw with more context
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
    const response = await axios.post(
      `${API_BASE_URL}/leavemanagement/notification-config/cc-config/role`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to update CC config for role:', error);
    throw error.response?.data || error.message || error;
  }
};