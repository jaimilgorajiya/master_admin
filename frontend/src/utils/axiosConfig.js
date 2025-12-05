// Axios Configuration with Token Expiration Handling
import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
});

// Request interceptor - Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Handle token expiration
      if (status === 401 && data.code === 'TOKEN_EXPIRED') {
        // Clear tokens
        localStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminToken');
        
        // Show message
        toast.error('Your session has expired. Please login again.');
        
        // Redirect to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
      
      // Handle invalid token
      else if (status === 401 && (data.code === 'INVALID_TOKEN' || data.code === 'AUTH_FAILED')) {
        // Clear tokens
        localStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminToken');
        
        // Show message
        toast.error('Authentication failed. Please login again.');
        
        // Redirect to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
