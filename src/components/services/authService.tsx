import apiClient from './apiClient';
import { LoginRequest, LoginResponse } from '@/types';

const TOKEN_KEY = 'authToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      
      if (response.data.statusCode === 2000 && response.data.data.accessToken) {
        localStorage.setItem(TOKEN_KEY, response.data.data.accessToken);
        const expiryTime = Date.now() + response.data.data.expiresIn * 1000;
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      }
      
      return response.data;
    } catch (error: any) {
      // Handle different error scenarios
      if (error.response?.data) {
        const { statusCode, statusMessage } = error.response.data;
        const httpStatus = error.response.status;
        
        // Handle all authentication-related failures as "Invalid email or password"
        if (
          // Backend status codes for auth failure
          statusCode === 4001 || statusCode === 401 || 
          // HTTP status codes for auth failure  
          httpStatus === 401 || httpStatus === 400 ||
          // Common error messages that indicate invalid credentials
          statusMessage?.toLowerCase().includes('bad request') ||
          statusMessage?.toLowerCase().includes('invalid') ||
          statusMessage?.toLowerCase().includes('unauthorized') ||
          statusMessage?.toLowerCase().includes('authentication') ||
          statusMessage?.toLowerCase().includes('credential')
        ) {
          throw new Error('Invalid email or password');
        }
        
        // Handle other backend errors (map to user-friendly message)
        throw new Error('Invalid email or password');
      }
      
      // Handle network errors
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        throw new Error('Network error. Please check your connection.');
      }
      
      // Handle server not reachable
      if (error.code === 'ECONNREFUSED' || !error.response) {
        throw new Error('Server not reachable. Please try again later.');
      }
      
      // Default to invalid credentials for any other authentication error
      throw new Error('Invalid email or password');
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem('leaveflow_auth_user');
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!token || !expiry) return false;
    
    if (Date.now() > parseInt(expiry)) {
      authService.logout();
      return false;
    }
    
    return true;
  }
};

export default authService;