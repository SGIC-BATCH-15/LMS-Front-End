import apiClient from './apiClient';

export interface Role {
  id: number;
  name: string;
}

export interface RoleResponse {
  statusCode: number;
  statusMessage: string;
  data: {
    page: number;
    size: number;
    totalRecords: number;
    totalPages: number;
    roles: Role[];
  };
}

export const roleService = {
  // Get all roles
  getAllRoles: async (): Promise<Role[]> => {
    try {
      console.log('🔄 Fetching roles from API...');
      console.log('📡 API URL: http://localhost:8081/api/v1/settings/roles/get');
      
      const response = await apiClient.get<RoleResponse>('/settings/roles/get');
      
      console.log('✅ Roles API Response received:', response);
      console.log('📊 Roles Response data:', response.data);
      console.log('👥 Roles data:', response.data?.data?.roles);
      
      if (response.data && response.data.data && response.data.data.roles) {
        const roles = response.data.data.roles;
        console.log(`✨ Successfully fetched ${roles.length} roles`);
        return roles;
      } else {
        console.warn('⚠️ API response does not contain expected roles data structure');
        console.warn('Expected: response.data.data.roles, Got:', response.data);
        throw new Error('Invalid roles API response structure');
      }
    } catch (error) {
      console.error('❌ Error fetching roles:', error);
      if (error.response) {
        console.error('📋 Response status:', error.response.status);
        console.error('📋 Response data:', error.response.data);
        
        if (error.response.status === 401 || error.response.status === 403) {
          throw new Error('Authentication required to fetch roles.');
        }
      } else if (error.request) {
        console.error('📡 Request was made but no response received:', error.request);
        throw new Error('Cannot connect to server for roles.');
      }
      throw error;
    }
  }
};

export default roleService;