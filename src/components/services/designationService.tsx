import apiClient from './apiClient';
import { Designation } from '@/data/designationsList';

export const designationService = {
  getAll: async (): Promise<Designation[]> => {
    try {
      console.log('designationService.getAll: calling GET /settings/designation');
      const response = await apiClient.get('/settings/designation', {
        params: { page: 0, size: 1000 },
      });
      const payload = response.data;
      console.log('designationService.getAll: response', payload);
      if (payload?.data?.content) {
        return payload.data.content;
      }
      if (Array.isArray(payload?.data)) {
        return payload.data;
      }
      if (Array.isArray(payload)) {
        return payload;
      }
      return [];
    } catch (error) {
      throw error;
    }
  },

  add: async (name: string, departmentId?: string): Promise<Designation> => {
    try {
      const payload: any = { name };
      // include company_id similar to other services to satisfy backend DTO
      payload.company_id = 1;
      if (departmentId) {
        payload.department_id = Number(departmentId);
        payload.departmentId = Number(departmentId);
      }
      console.log('designationService.add: POST /settings/designation/add payload', payload);
      const response = await apiClient.post('/settings/designation/add', payload);
      console.log('designationService.add: response', response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('designationService.add: error', error);
      throw error;
    }
  },

  update: async (id: string, name: string, departmentId?: string): Promise<Designation> => {
    try {
      const payload: any = { name };
      payload.company_id = 1;
      if (departmentId) {
        payload.department_id = Number(departmentId);
        payload.departmentId = Number(departmentId);
      }
      console.log(`designationService.update: PUT /settings/designation/${id} payload`, payload);
      const response = await apiClient.put(`/settings/designation/${id}`, payload);
      console.log('designationService.update: response', response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('designationService.update: error', error);
      throw error;
    }
  },

  remove: async (id: string): Promise<void> => {
    try {
      console.log(`designationService.remove: DELETE /settings/designation/${id}`);
      const resp = await apiClient.delete(`/settings/designation/${id}`);
      console.log('designationService.remove: response', resp.status, resp.data);
    } catch (error) {
      console.error('designationService.remove: error', error);
      throw error;
    }
  },
};

export default designationService;
