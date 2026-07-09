import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Extend the config type to add a flag for retry
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  withCredentials: true, //sends cookies automatically
  headers: { 'Content-Type': 'application/json' },
});

// Flag to prevent multiple refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach(promise => {
    if (error) promise.reject(error);
    else promise.resolve(null);
  });
  failedQueue = [];
};

// Request interceptor – no manual token attachment (cookies handle auth)
axiosClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor – handle 401 by refreshing token
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    if (!originalRequest) return Promise.reject(error);

    // If error is 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while token is being refreshed
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call the refresh endpoint (it will set new cookies)
        await axios.post(
          '/api/admin/refresh',
          {},
          { withCredentials: true }
        );
        // Token refreshed – process queued requests
        processQueue(null);
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed – logout user
        processQueue(refreshError as Error);
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/auth/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;