import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Resolve an appropriate API host for the current runtime.
// Priority:
// 1. EXPO_PUBLIC_API_URL / API_URL environment variable if provided.
// 2. Production server on Render
// 3. For Android emulators use 10.0.2.2 (local development)
// 4. Default to localhost
const getDefaultHost = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL || process.env.API_URL || null;
  if (envUrl) return envUrl;

  // Use production server by default
  // return 'https://farm-management-nh9y.onrender.com/api';

  return 'http://192.168.100.161:5000/api';

  // Uncomment below for local development
  // if (Platform.OS === 'android') {
  //   return 'http://10.0.2.2:5000/api';
  // }
  // return 'http://localhost:5000/api';
};

const API_URL = getDefaultHost();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // if API returns 401, clear stored credentials and bubble up
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // Navigate to login, but since no navigation here, perhaps emit event or something
    }
    return Promise.reject(error);
  }
);

export default api;