import apiClient from "./apiClient";

// Role request/response types
interface RoleRequestDto {
  name: string;
}

interface RoleResponseDto {
  id: number;
  name: string;
}

interface RolePaginationDto {
  roles: RoleResponseDto[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

export interface Role {
  id: number;
  name: string;
}

export const roleService = {
  // Get all roles (unpaginated)
  getAllRoles: async () => {
    const response = await apiClient.get(`/settings/roles/get`, {
      params: { page: 0, size: 1000 }
    });
    // Extract roles from response.data.data.roles
    const roles = response.data?.data?.roles || [];
    return roles;
  },

  // Get paginated roles
  getRoles: async (page: number, size: number) => {
    const response = await apiClient.get(`/settings/roles/get`, {
      params: { page, size }
    });
    return response.data;
  },

  // Create new role
  createRole: async (roleData: RoleRequestDto) => {
    const response = await apiClient.post(`/settings/roles/add`, roleData);
    return response.data.data; // unwrap ResponseWrapper
  },

  // Update existing role
  updateRole: async (id: number, roleData: RoleRequestDto) => {
    const response = await apiClient.put(`/settings/roles/${id}`, roleData);
    return response.data.data; // unwrap ResponseWrapper
  },

  // Get role by ID
  getRoleById: async (id: number) => {
    const response = await apiClient.get(`/settings/roles/${id}`);
    return response.data.data; // unwrap ResponseWrapper
  },

  // Delete role
  deleteRole: async (id: number) => {
    const response = await apiClient.delete(`/settings/roles/${id}`);
    return response.data; // returns void/null
  }
};
