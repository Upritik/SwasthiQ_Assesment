import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://swasthiq-assesment-3.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;