import apiClient from './apiClient';
import { Company } from '../../data/companies';

export interface CompanyResponse {
  statusCode: number;
  statusMessage: string;
  data: {
    content: Company[];
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

export const companyService = {
  // Get all companies
  getAllCompanies: async (): Promise<Company[]> => {
    try {
      console.log('🔄 Fetching companies from API...');
      console.log('📡 API URL: http://localhost:8081/api/v1/settings/company');
      
      const response = await apiClient.get<CompanyResponse>('/settings/company');
      
      console.log('✅ API Response received:', response);
      console.log('📊 Response data:', response.data);
      console.log('🏢 Companies data:', response.data?.data);
      
      if (response.data && response.data.data && response.data.data.content) {
        const companies = response.data.data.content;
        console.log(`✨ Successfully fetched ${companies.length} companies from paginated response`);
        console.log('🏢 Companies:', companies);
        return companies;
      } else {
        console.warn('⚠️ API response does not contain expected paginated data structure');
        console.warn('Expected: response.data.data.content, Got:', response.data);
        throw new Error('Invalid API response structure - missing content array');
      }
    } catch (error) {
      console.error('❌ Error fetching companies:', error);
      if (error.response) {
        console.error('📋 Response status:', error.response.status);
        console.error('📋 Response data:', error.response.data);
        
        // Check for authentication errors
        if (error.response.status === 401 || error.response.status === 403) {
          console.error('🔒 Authentication required - user needs to login');
          throw new Error('Authentication required. Please login to access companies.');
        }
        
        if (error.response.data?.statusCode === 4001) {
          console.error('🔑 Backend requires authentication - token missing or invalid');
          throw new Error('Authentication failed. Please login again.');
        }
      } else if (error.request) {
        console.error('📡 Request was made but no response received:', error.request);
        throw new Error('Cannot connect to server. Please check if the backend is running.');
      } else {
        console.error('⚙️ Error setting up request:', error.message);
      }
      throw error;
    }
  }
};

export default companyService;