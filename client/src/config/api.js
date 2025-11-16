// API Configuration
import axios from 'axios';

// Use relative URLs by default to avoid CSP issues with ngrok/different domains
// Only use absolute URL if explicitly set via environment variable
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export default api;
export { API_BASE_URL };
