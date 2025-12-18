import apiClient from './apiClient';

export interface Department {
  id: number;
  name: string;
  company_id: number;
}

export interface DepartmentResponse {
  statusCode: number;
  statusMessage: string;
  data: {
    content: Department[];
    empty: boolean;
    first: boolean;
    last: boolean;
    number: number;
    numberOfElements: number;
    pageable: {
      offset: number;
      pageNumber: number;
      pageSize: number;
      paged: boolean;
      sort: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
      };
      unpaged: boolean;
    };
    size: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    totalElements: number;
    totalPages: number;
  };
}

export const departmentService = {
  // Get departments by company ID
  getDepartmentsByCompanyId: async (companyId: string | number): Promise<Department[]> => {
    try {
      console.log(`🏢 Fetching departments for company ID: ${companyId}`);
      
      const response = await apiClient.get<DepartmentResponse>(`/settings/department?companyId=${companyId}`);
      
      console.log('✅ Department API Response received:', response);
      console.log('📊 Department Response data:', response.data);
      
      if (response.data && response.data.data && response.data.data.content) {
        const departments = response.data.data.content;
        console.log(`✨ Successfully fetched ${departments.length} departments for company ${companyId}`);
        console.log('🏬 Departments:', departments);
        return departments;
      } else {
        console.warn('⚠️ API response does not contain expected department data structure');
        console.warn('Expected: response.data.data.content, Got:', response.data);
        throw new Error('Invalid department API response structure');
      }
    } catch (error) {
      console.error('❌ Error fetching departments:', error);
      if (error.response) {
        console.error('📋 Response status:', error.response.status);
        console.error('📋 Response data:', error.response.data);
        
        if (error.response.status === 401 || error.response.status === 403) {
          throw new Error('Authentication required to fetch departments.');
        }
      } else if (error.request) {
        console.error('📡 Request was made but no response received:', error.request);
        throw new Error('Cannot connect to server for departments.');
      }
      throw error;
    }
  }
};

export default departmentService;