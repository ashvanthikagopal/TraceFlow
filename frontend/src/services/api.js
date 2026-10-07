import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('traceflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const socialLoginUser = async (socialData) => {
  const response = await api.post('/auth/social-login', socialData);
  return response.data;
};

// Project endpoints
export const uploadJavaFile = async (file, userId) => {
  const formData = new FormData();
  formData.append('file', file);
  if (userId) {
    formData.append('userId', userId);
  }
  const response = await api.post('/projects/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const createProject = async (projectData) => {
  const response = await api.post('/projects/create', projectData);
  return response.data;
};

export const getProjects = async (userId) => {
  const response = await api.get('/projects', { params: { userId } });
  return response.data;
};

export const getProject = async (projectId) => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data;
};

// Analysis endpoints
export const startAnalysis = async (projectId) => {
  const response = await api.post(`/analysis/${projectId}/start`);
  return response.data;
};

export const debugCodeDirectly = async (sourceCode, fileName, userId) => {
  const response = await api.post('/analysis/debug-code', { sourceCode, fileName, userId });
  return response.data;
};

export const getAnalysis = async (analysisId) => {
  const response = await api.get(`/analysis/${analysisId}`);
  return response.data;
};

export const getLatestAnalysis = async (projectId) => {
  const response = await api.get(`/analysis/project/${projectId}/latest`);
  return response.data;
};

export const getUserAnalyses = async (userId) => {
  const response = await api.get(`/analysis/user/${userId}`);
  return response.data;
};

export const getPrediction = async (analysisId) => {
  const response = await api.get(`/analysis/${analysisId}/prediction`);
  return response.data;
};

// Trace endpoints
export const getTrace = async (analysisId) => {
  const response = await api.get(`/analysis/${analysisId}/trace`);
  return response.data;
};

export const getVariables = async (analysisId) => {
  const response = await api.get(`/analysis/${analysisId}/variables`);
  return response.data;
};

// IntelliTrace Engine endpoints
export const runIntelliTrace = async (sourceCode, fileName) => {
  const response = await api.post('/analysis/intellitrace', { sourceCode, fileName });
  return response.data;
};

export const getSampleCode = async () => {
  const response = await api.get('/analysis/sample-code');
  return response.data;
};

export const exportTraceCsv = async (analysisId) => {
  const response = await api.get(`/analysis/${analysisId}/export/csv`, {
    responseType: 'blob',
  });
  return response.data;
};

export const getAllUsers = async () => {
  const response = await api.get('/auth/users');
  return response.data;
};

export default api;
