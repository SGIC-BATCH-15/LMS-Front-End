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

// Get paginated roles
export const getRoles = async (page: number, size: number) => {
  const response = await apiClient.get(`/settings/roles/get`, {
    params: { page, size }
  });
  return response.data;
};

// Create new role
export const createRole = async (roleData: RoleRequestDto) => {
  const response = await apiClient.post(`/settings/roles/add`, roleData);
  return response.data.data; // unwrap ResponseWrapper
};

// Update existing role
export const updateRole = async (id: number, roleData: RoleRequestDto) => {
  const response = await apiClient.put(`/settings/roles/${id}`, roleData);
  return response.data.data; // unwrap ResponseWrapper
};

// Get role by ID
export const getRoleById = async (id: number) => {
  const response = await apiClient.get(`/settings/roles/${id}`);
  return response.data.data; // unwrap ResponseWrapper
};

// Delete role
export const deleteRole = async (id: number) => {
  const response = await apiClient.delete(`/settings/roles/${id}`);
  return response.data; // returns void/null
};
