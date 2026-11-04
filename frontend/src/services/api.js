/**
 * Centralized HTTP Client / API Layer for TaskNera CEO Command Centre
 */

const RAW_URL = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/+$/, '');
const BASE_URL =
  RAW_URL === '' || RAW_URL === '/api'
    ? '/api'
    : RAW_URL.endsWith('/api')
    ? RAW_URL
    : `${RAW_URL}/api`;

export const apiClient = async (endpoint, options = {}) => {
  const token = localStorage.getItem('tasknera_ceo_token') || localStorage.getItem('hrms_token');
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  if (isFormData) {
    delete headers['Content-Type'];
    delete headers['content-type'];
  }

  const config = {
    cache: 'no-store',
    ...options,
    headers,
  };

  if (!isFormData && config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  let queryString = '';
  if (options.params && typeof options.params === 'object') {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      queryString = (endpoint.includes('?') ? '&' : '?') + qs;
    }
  }

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}${queryString}`;

  try {
    const response = await fetch(url, config);

    // Handle 401 Unauthorized globally
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('tasknera_ceo_token');
      localStorage.removeItem('tasknera_ceo_user');
      window.dispatchEvent(new CustomEvent('tasknera:auth:expired'));
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || 'An unexpected error occurred.');
      error.status = response.status;
      error.errors = data.errors || [];
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
};

export const http = {
  get: (endpoint, options) => apiClient(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => apiClient(endpoint, { method: 'POST', body, ...options }),
  put: (endpoint, body, options) => apiClient(endpoint, { method: 'PUT', body, ...options }),
  patch: (endpoint, body, options) => apiClient(endpoint, { method: 'PATCH', body, ...options }),
  delete: (endpoint, options) => apiClient(endpoint, { method: 'DELETE', ...options }),
};
