import apiClient from './apiClient';

export interface AddEmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyId: number;
  departmentId: number;
  roleIds: number[]; // Matches backend DTO: List<Long> roleIds
  joinDate: string;
  previousExperience: number;
}

export interface UpdateEmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  password?: string; // Optional for update
  companyId: number;
  departmentId: number;
  roleIds: number[];
  joinDate: string;
  previousExperience: number;
}

export interface AddEmployeeResponse {
  statusCode: number;
  statusMessage: string;
  data: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    companyId: number;
    departmentId: number;
    roleIds: number[]; // Matches backend DTO: List<Long> roleIds
    joinDate: string;
    previousExperience: number;
  };
}

export const employeeService = {
  // Add new employee
  addEmployee: async (employeeData: AddEmployeeRequest): Promise<AddEmployeeResponse> => {
    try {
      console.log('� Adding new employee to backend...');
      console.log('📡 API URL: http://localhost:8081/api/v1/settings/employees/add');
      console.log('📝 Employee Data being sent:', JSON.stringify(employeeData, null, 2));
      
      // Check authentication
      const token = localStorage.getItem('authToken');
      if (!token || token === 'undefined' || token === 'null') {
        throw new Error('No authentication token found. Please login first.');
      }
      console.log('🔑 Using auth token:', token.substring(0, 20) + '...');
      
      const response = await apiClient.post<AddEmployeeResponse>('/settings/employees/add', employeeData);
      
      console.log('✅ Employee Add API Response Status:', response.status);
      console.log('✅ Employee Add API Response:', response);
      console.log('📊 Employee Response data:', response.data);
      
      if (response.status === 200 || response.status === 201) {
        // Backend uses 2001 for successful creation, 2000 for success
        if (response.data && (response.data.statusCode === 2001 || response.data.statusCode === 2000 || response.data.statusCode === 200)) {
          console.log('🎉 Successfully added employee to backend database!');
          return response.data;
        } else {
          console.warn('⚠️ Unexpected response structure or status code:', response.data);
          throw new Error(`API returned status: ${response.data?.statusCode} - ${response.data?.statusMessage}`);
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error adding employee:', error);
      console.error('❌ Full error details:', JSON.stringify(error, null, 2));
      
      if (error.response) {
        console.error('📋 Response status:', error.response.status);
        console.error('📋 Response headers:', error.response.headers);
        console.error('📋 Response data:', error.response.data);
        
        // Handle specific error cases with detailed backend messages
        if (error.response.status === 400) {
          // Extract detailed validation messages from backend
          const responseData = error.response.data;
          console.log('🔍 Analyzing 400 error response:', responseData);
          
          // Check for different possible error message formats from backend
          if (responseData?.data && Array.isArray(responseData.data) && responseData.data.length > 0) {
            // Handle validation errors in data array format
            console.log('📝 Validation errors found in data array:', responseData.data);
            // Log each error object individually for better debugging
            responseData.data.forEach((error: any, index: number) => {
              console.log(`🔍 Error ${index + 1}:`, JSON.stringify(error, null, 2));
            });
            const validationErrors = responseData.data.map(err => {
              if (typeof err === 'string') {
                return err;
              } else if (err.message) {
                return err.message;
              } else if (err.field && err.error) {
                return `${err.field}: ${err.error}`;
              } else {
                return JSON.stringify(err);
              }
            });
            throw new Error(validationErrors.join('. '));
          } else if (responseData?.errors) {
            // Handle field-specific validation errors (array format)
            const fieldErrors = responseData.errors.map(err => err.message || err).join(', ');
            throw new Error(`Validation errors: ${fieldErrors}`);
          } else if (responseData?.message) {
            // Handle single validation message
            throw new Error(responseData.message);
          } else if (responseData?.statusMessage) {
            // Handle status message format (but prefer data array if available)
            throw new Error(responseData.statusMessage);
          } else if (responseData?.data?.message) {
            // Handle nested message format
            throw new Error(responseData.data.message);
          } else if (responseData?.data?.errors) {
            // Handle nested errors format
            const nestedErrors = responseData.data.errors.map(err => err.message || err).join(', ');
            throw new Error(`Validation errors: ${nestedErrors}`);
          } else if (typeof responseData === 'string') {
            // Handle plain string response
            throw new Error(responseData);
          } else {
            // Fallback to generic message with full response for debugging
            console.log('Unhandled 400 response format:', responseData);
            throw new Error('Invalid employee data provided. Check console for details.');
          }
        } else if (error.response.status === 409) {
          const responseData = error.response.data;
          const conflictMessage = responseData?.message || responseData?.statusMessage || 'Employee with this email already exists.';
          throw new Error(conflictMessage);
        } else if (error.response.status === 401 || error.response.status === 403) {
          const responseData = error.response.data;
          const authMessage = responseData?.message || responseData?.statusMessage || 'Authentication required to add employee.';
          throw new Error(authMessage);
        } else {
          // Handle other HTTP status codes
          const responseData = error.response.data;
          let errorMessage = 'Server error occurred.';
          
          if (responseData?.message) {
            errorMessage = responseData.message;
          } else if (responseData?.statusMessage) {
            errorMessage = responseData.statusMessage;
          } else if (responseData?.data?.message) {
            errorMessage = responseData.data.message;
          } else if (error.response.statusText) {
            errorMessage = error.response.statusText;
          }
          
          throw new Error(`${errorMessage} (Status: ${error.response.status})`);
        }
      } else if (error.request) {
        console.error('📡 Request was made but no response received:', error.request);
        throw new Error('Cannot connect to server to add employee. Please check if backend is running.');
      } else {
        console.error('⚙️ Error setting up request:', error.message);
        throw new Error(error.message || 'Failed to add employee.');
      }
    }
  },

  // Get employees by company ID
  getEmployeesByCompany: async (companyId: number): Promise<any[]> => {
    try {
      console.log(`🔄 Fetching employees for company ID: ${companyId}`);
      console.log(`📡 API URL: http://localhost:8081/api/v1/settings/employees?companyId=${companyId}`);
      
      const response = await apiClient.get(`/settings/employees?companyId=${companyId}`);
      
      console.log('✅ Employees API Response received:', response);
      console.log('📊 Response data:', response.data);
      
      if (response.data && response.data.data) {
        const employees = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
        console.log(`✨ Successfully fetched ${employees.length} employees for company ${companyId}`);
        return employees;
      } else if (Array.isArray(response.data)) {
        console.log(`✨ Successfully fetched ${response.data.length} employees (direct array)`);
        return response.data;
      } else {
        console.warn('⚠️ Unexpected response structure:', response.data);
        return [];
      }
    } catch (error) {
      console.error(`❌ Error fetching employees for company ${companyId}:`, error);
      if (error.response) {
        console.error('📋 Response status:', error.response.status);
        console.error('📋 Response data:', error.response.data);
        
        if (error.response.status === 401 || error.response.status === 403) {
          throw new Error('Authentication required. Please login to access employees.');
        }
      }
      throw new Error('Failed to fetch employees from backend.');
    }
  },

  // Get all employees
  getAllEmployees: async (): Promise<any[]> => {
    try {
      console.log('🔄 Fetching all employees from API...');
      console.log('📡 API URL: http://localhost:8081/api/v1/settings/employees');
      
      const response = await apiClient.get('/settings/employees');
      
      console.log('✅ All Employees API Response received:', response);
      console.log('📊 Response data:', response.data);
      
      if (response.data && response.data.data) {
        const employees = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
        console.log(`✨ Successfully fetched ${employees.length} employees`);
        return employees;
      } else if (Array.isArray(response.data)) {
        console.log(`✨ Successfully fetched ${response.data.length} employees (direct array)`);
        return response.data;
      } else {
        console.warn('⚠️ Unexpected response structure:', response.data);
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching all employees:', error);
      if (error.response) {
        console.error('📋 Response status:', error.response.status);
        console.error('📋 Response data:', error.response.data);
        
        if (error.response.status === 401 || error.response.status === 403) {
          throw new Error('Authentication required. Please login to access employees.');
        }
      }
      throw new Error('Failed to fetch employees from backend.');
    }
  },

  // Update existing employee
  updateEmployee: async (employeeId: string, employeeData: UpdateEmployeeRequest): Promise<AddEmployeeResponse> => {
    try {
      console.log(`🔄 Updating employee ID: ${employeeId}`);
      console.log('📡 API URL:', `http://localhost:8081/api/v1/settings/employees/${employeeId}`);
      console.log('📝 Employee Update Data:', JSON.stringify(employeeData, null, 2));
      
      // Check authentication
      const token = localStorage.getItem('authToken');
      if (!token || token === 'undefined' || token === 'null') {
        throw new Error('No authentication token found. Please login first.');
      }
      
      const response = await apiClient.put<AddEmployeeResponse>(`/settings/employees/${employeeId}`, employeeData);
      
      console.log('✅ Employee Update API Response Status:', response.status);
      console.log('✅ Employee Update API Response:', response);
      console.log('📊 Employee Response data:', response.data);
      
      if (response.status === 200 || response.status === 201) {
        // Backend uses 2001 for successful update, 2000 for success
        if (response.data && (response.data.statusCode === 2001 || response.data.statusCode === 2000 || response.data.statusCode === 200)) {
          console.log('🎉 Successfully updated employee in backend database!');
          return response.data;
        } else {
          console.warn('⚠️ Unexpected response structure or status code:', response.data);
          throw new Error(`API returned status: ${response.data?.statusCode} - ${response.data?.statusMessage}`);
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error updating employee:', error);
      console.error('❌ Full error details:', JSON.stringify(error, null, 2));
      
      if (error.response) {
        console.error('📋 Response status:', error.response.status);
        console.error('📋 Response headers:', error.response.headers);
        console.error('📋 Response data:', error.response.data);
        
        // Handle specific error cases with detailed backend messages
        if (error.response.status === 400) {
          const responseData = error.response.data;
          console.log('🔍 Analyzing 400 error response:', responseData);
          
          if (responseData?.data && Array.isArray(responseData.data) && responseData.data.length > 0) {
            console.log('📝 Validation errors found in data array:', responseData.data);
            responseData.data.forEach((error: any, index: number) => {
              console.log(`🔍 Error ${index + 1}:`, JSON.stringify(error, null, 2));
            });
            const validationErrors = responseData.data.map(err => {
              if (typeof err === 'string') {
                return err;
              } else if (err.message) {
                return err.message;
              } else if (err.field && err.error) {
                return `${err.field}: ${err.error}`;
              } else {
                return JSON.stringify(err);
              }
            });
            throw new Error(validationErrors.join('. '));
          } else if (responseData?.statusMessage) {
            throw new Error(responseData.statusMessage);
          }
        } else if (error.response.status === 401 || error.response.status === 403) {
          throw new Error('Authentication required. Please login to update employee.');
        }
        
        throw new Error(`Failed to update employee: ${error.response.statusText}`);
      } else if (error.request) {
        console.error('📡 Request was made but no response received:', error.request);
        throw new Error('Cannot connect to server. Please check if backend is running.');
      } else {
        throw new Error(error.message || 'Failed to update employee.');
      }
    }
  },

  // Delete employee
  deleteEmployee: async (employeeId: string): Promise<void> => {
    try {
      console.log(`🗑️ Deleting employee ID: ${employeeId}`);
      console.log('📡 API URL:', `http://localhost:8081/api/v1/settings/employees/${employeeId}`);
      
      // Check authentication
      const token = localStorage.getItem('authToken');
      if (!token || token === 'undefined' || token === 'null') {
        throw new Error('No authentication token found. Please login first.');
      }
      
      const response = await apiClient.delete(`/settings/employees/${employeeId}`);
      
      console.log('✅ Employee Delete API Response Status:', response.status);
      console.log('✅ Employee Delete API Response:', response);
      
      if (response.status === 200 || response.status === 204) {
        console.log('🎉 Successfully deleted employee from backend database!');
        return;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error deleting employee:', error);
      console.error('❌ Full error details:', JSON.stringify(error, null, 2));
      
      if (error.response) {
        console.error('📋 Response status:', error.response.status);
        console.error('📋 Response data:', error.response.data);
        
        if (error.response.status === 401 || error.response.status === 403) {
          throw new Error('Authentication required. Please login to delete employee.');
        } else if (error.response.status === 404) {
          throw new Error('Employee not found.');
        }
        
        const responseData = error.response.data;
        if (responseData?.statusMessage) {
          throw new Error(responseData.statusMessage);
        }
        
        throw new Error(`Failed to delete employee: ${error.response.statusText}`);
      } else if (error.request) {
        console.error('📡 Request was made but no response received:', error.request);
        throw new Error('Cannot connect to server. Please check if backend is running.');
      } else {
        throw new Error(error.message || 'Failed to delete employee.');
      }
    }
  }
};

export default employeeService;