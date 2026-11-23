import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to inject trace headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Dynamically inject token if available in memory
    const token = sessionStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor for unified error formatting
apiClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<{ message?: string; code?: string }>) => {
    const errorPayload = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      code: error.response?.data?.code || 'NETWORK_ERROR',
      status: error.response?.status || 500,
    };
    return Promise.reject(errorPayload);
  }
);
