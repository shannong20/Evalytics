import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Types
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  errors?: Array<{ msg: string; param?: string }>;
}

export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  middle_initial?: string;
  email: string;
  user_type: 'Admin' | 'User';
  role?: 'Faculty' | 'Student' | 'Supervisor';
  department_id?: number;
}

export interface Department {
  department_id: string;
  name: string;
}

export interface Question {
  question_id: number;
  text: string;
  weight: number;
  category_id: number;
}

export interface Category {
  category_id: number;
  name: string;
  weight: number;
  questions: Question[];
}

export interface EvaluationResponse {
  question_id: number;
  rating: number;
}

export interface EvaluationData {
  evaluator_id: number;
  evaluatee_id: number;
  responses: EvaluationResponse[];
  // Optional fields that may be sent by clients; server may ignore
  form_id?: number;
  department?: string;
}

// Helper function to transform axios response to our ApiResponse format
function transformResponse<T = any>(response: AxiosResponse): ApiResponse<T> {
  if (response.status >= 200 && response.status < 300) {
    // If the response already has our expected format, return it as is
    if (response.data && 'status' in response.data && 'data' in response.data) {
      return response.data as ApiResponse<T>;
    }
    // Otherwise, wrap it in our standard response format
    return {
      status: 'success',
      data: response.data
    };
  }
  
  // Handle error responses
  return {
    status: 'error',
    message: response.data?.message || 'An error occurred',
    errors: response.data?.errors,
    data: response.data?.data
  };
}

// Create axios instance with base URL
const api: AxiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor to transform all responses
api.interceptors.response.use(
  (response) => {
    // Transform successful responses
    return {
      ...response,
      data: transformResponse(response)
    };
  },
  (error) => {
    // Transform error responses
    if (error.response) {
      return Promise.resolve({
        ...error.response,
        data: transformResponse(error.response)
      });
    }
    
    // Handle network errors
    return Promise.resolve({
      status: 500,
      statusText: 'Network Error',
      data: {
        status: 'error',
        message: 'Network error. Please check your connection.'
      },
      headers: {},
      config: error.config
    });
  }
);

// Helper function to get token from localStorage
const getAuthToken = (): string | null => {
  try {
    const authData = localStorage.getItem('auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      if (parsed?.token) {
        return parsed.token;
      }
    }
  } catch (e) {
    console.warn('Error parsing auth data:', e);
  }
  const token = localStorage.getItem('token');
  if (token) {
    return token;
  }
  return sessionStorage.getItem('token');
};

// Add request interceptor to include token in headers
api.interceptors.request.use(
  (config: AxiosRequestConfig): any => {
    const publicRoutes = ['/auth/login', '/auth/signup', '/auth/register'];
    const isPublicRoute = publicRoutes.some(route => config.url?.includes(route));

    if (!isPublicRoute) {
      const token = getAuthToken();
      if (token) {
        // Modern Axios syntax for headers
        if (config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          config.headers = { Authorization: `Bearer ${token}` };
        }
      } else {
        console.warn('No auth token found for protected route:', config.url);
      }
    }
    
    // Automatically set Content-Type header
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    } else if (config.data && typeof config.data === 'object' && !config.headers?.['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for centralized error handling and response formatting
api.interceptors.response.use(
  (response: AxiosResponse): ApiResponse => {
    // If the server returns a new token, save it
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
    }
    // Return a consistent ApiResponse format
    return {
      status: 'success',
      data: response.data?.data || response.data,
      message: response.data?.message,
    };
  },
  (error: AxiosError): Promise<ApiResponse> => {
    console.error('API Error:', error);

    const isAuthRoute = error.config?.url?.includes('/auth/');

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      if (!isAuthRoute) {
        // Clear any invalid auth data
        localStorage.removeItem('auth');
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        
        const returnUrl = window.location.pathname + window.location.search;
        window.location.href = `/login?session_expired=true&returnUrl=${encodeURIComponent(returnUrl)}`;
      }
      return Promise.reject({
        status: 'error',
        message: error.response.data?.message || 'Session expired. Please log in again.',
      });
    }

    // Handle other errors
    let errorMessage: string;
    let errors = error.response?.data?.errors;
    
    if (error.response) {
      // The request was made and the server responded with a status code outside the 2xx range
      errorMessage = error.response.data?.message || `Server responded with status: ${error.response.status}`;
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response from server. Please check your connection.';
    } else {
      // Something happened in setting up the request
      errorMessage = error.message || 'An unexpected error occurred.';
    }

    return Promise.reject({
      status: 'error',
      message: errorMessage,
      errors: errors,
    });
  }
);

// API Service
const apiService = {
  // Reports API
  reports: {
    getOverallAverages: async (): Promise<ApiResponse> => {
      return await api.get('/reports/overall');
    },
    getCategoryAverages: async (evaluateeId: number | string): Promise<ApiResponse> => {
      return await api.get(`/reports/${evaluateeId}/categories`);
    },
    getTopFaculty: async (limit: number = 10): Promise<ApiResponse> => {
      return await api.get('/reports/top-faculty', { params: { limit } });
    },
  },

  // Auth methods
  auth: {
    login: async (email: string, password: string): Promise<ApiResponse<User>> => {
      const response = await api.post('/auth/login', { email, password });
      return response;
    },
    register: async (userData: Omit<User, 'user_id'> & { password: string }): Promise<ApiResponse<User>> => {
      const response = await api.post('/auth/register', userData);
      return response;
    },
    getSession: async (): Promise<ApiResponse<User | null>> => {
      const token = getAuthToken();
      if (!token) {
        return Promise.reject({ status: 'error', message: 'No active session. Please log in.', data: null });
      }
      const response = await api.get('/auth/me');
      return response;
    },
    logout: (): void => {
      localStorage.removeItem('auth');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    },
  },

  // Users API
  users: {
    create: async (userData: Omit<User, 'user_id'> & { password: string }): Promise<ApiResponse<User>> => {
      const response = await api.post('/users', userData);
      return response;
    },
    getById: async (userId: string): Promise<ApiResponse<User>> => {
      const response = await api.get(`/users/${userId}`);
      return response;
    },
    list: async (filters: {
      userType?: 'Admin' | 'User';
      role?: 'Faculty' | 'Student' | 'Supervisor';
      departmentId?: number | string;
      includeEvaluations?: boolean;
    } = {}): Promise<ApiResponse<{ users: User[] }>> => {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== undefined && value !== null)
      );
      
      try {
        // Use a type assertion to tell TypeScript about our transformed response
        const response = await api.get<ApiResponse<{ users: User[] }>>('/users', { params });
        
        // The response.data is already in the correct format due to the interceptor
        // But we'll ensure it has the users array
        const responseData = response.data as ApiResponse<{ users: User[] }>;
        
        if (responseData.status === 'success') {
          // If we have data but it's not in the expected format, try to normalize it
          if (responseData.data && !('users' in responseData.data)) {
            const users = Array.isArray(responseData.data) ? responseData.data : [];
            return {
              status: 'success',
              data: { users },
              message: responseData.message
            };
          }
          return responseData;
        }
        
        // If we get here, there was an error
        return responseData;
      } catch (error: any) {
        console.error('Error fetching users:', error);
        return {
          status: 'error',
          message: error.message || 'Failed to fetch users',
          data: { users: [] }
        };
      }
    },
    update: async (userId: string, updates: Partial<User>): Promise<ApiResponse<User>> => {
      const response = await api.put(`/users/${userId}`, updates);
      return response;
    },
    updatePassword: async (userId: string, currentPassword: string, newPassword: string): Promise<ApiResponse> => {
      const response = await api.put(`/users/${userId}/password`, { currentPassword, newPassword });
      return response;
    },
    delete: async (userId: string): Promise<ApiResponse> => {
      const response = await api.delete(`/users/${userId}`);
      return response;
    },
  },

  // Departments API
  departments: {
    list: async (): Promise<ApiResponse<Department[]>> => {
      const response = await api.get('/departments');
      return response;
    },
    findByName: async (name: string): Promise<ApiResponse<Department[]>> => {
      const response = await api.get('/departments/search', { params: { name } });
      return response;
    },
  },
  
  // Questions API
  questions: {
    getCategories: async (): Promise<ApiResponse<Category[]>> => {
      const response = await api.get('/questions/questions-with-categories');
      return response;
    },
    createQuestion: async (data: {
      text: string;
      category_id: number | string;
      weight?: number | null;
    }): Promise<ApiResponse<Question>> => {
      const payload = {
        ...data,
        category_id: typeof data.category_id === 'string'
          ? parseInt(data.category_id, 10)
          : data.category_id
      };
      const response = await api.post('/questions', payload);
      return response;
    },
  },

  // Evaluations API
  evaluations: {
    submit: async (evaluationData: EvaluationData): Promise<ApiResponse> => {
      const response = await api.post('/evaluations', evaluationData);
      return response;
    },
    getByEvaluatee: async (evaluateeId: string | number): Promise<ApiResponse> => {
      const response = await api.get(`/evaluations/evaluatee/${evaluateeId}`);
      return response;
    },
    getByEvaluator: async (evaluatorId: string | number): Promise<ApiResponse> => {
      const response = await api.get(`/evaluations/evaluator/${evaluatorId}`);
      return response;
    }
  }
};

export { apiService };
export default apiService;