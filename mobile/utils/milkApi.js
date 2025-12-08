import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:5000/api' || process.env.EXPO_PUBLIC_API_URL;

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

instance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const milkApi = {
  upsert: (data) => instance.post('/milk-entries', data),
  getById: (id) => instance.get(`/milk-entries/${id}`),
  getByAnimalDate: (farmId, animalId, date) =>
    instance.get('/milk-entries', { params: { farmId, animalId, date } }),
  listByDate: (farmId, date) =>
    instance.get('/milk-entries', { params: { farmId, date } }),
  listByAnimalRange: (farmId, animalId, startDate, endDate) =>
    instance.get('/milk-entries/animal', { params: { farmId, animalId, startDate, endDate } }),
  delete: (id) => instance.delete(`/milk-entries/${id}`)
};

export default milkApi;
