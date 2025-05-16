import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000',
});

// Add interceptors
apiClient.interceptors.request.use(config => {
  // Add the API key to all requests
  config.headers['apis-key'] = 'sg-309549b5f26d4ef5';
  
  // Add auth token to requests if available
  const authToken = localStorage.getItem('auth_token');
  if (authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  return config;
});

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Handle authentication errors (401 Unauthorized)
    if (error.response && error.response.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_email');
      
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Create specific API functions
export const authAPI = {
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/api/admin/login', { email, password });
      if (response.data.success && response.data.auth_token) {
        localStorage.setItem('auth_token', response.data.auth_token);
        localStorage.setItem('user_email', email);
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please try again.' 
      };
    }
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    // You could also call an API endpoint to invalidate the token on the server
    return { success: true };
  },
  
  verifyToken: async () => {
    try {
      const response = await apiClient.get('/api/admin/verify-token');
      return response.data.success === true;
    } catch (error) {
      return false;
    }
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  }
};

export default apiClient;