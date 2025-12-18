import axios from 'axios';

// Priority: use VITE_API_BASE_URL from environment (Docker/production), fallback to local dev URL
const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7184/api';

const axiosClient = axios.create({
    baseURL,
    headers: {
        contentType: 'application/json',
    },
});

axiosClient.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('token');
    if(token){
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosClient;

