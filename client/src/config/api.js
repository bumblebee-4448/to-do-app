import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Request failed';
    const normalized = new Error(message);
    normalized.status = error.response?.status;
    normalized.errors = error.response?.data?.errors || [];
    return Promise.reject(normalized);
  },
);
