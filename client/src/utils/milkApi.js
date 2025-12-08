import axios from 'axios';

const API_BASE = '/api/milk-entries';

const milkApi = {
  upsert: (data) => axios.post(`${API_BASE}`, data),
  getById: (id) => axios.get(`${API_BASE}/${id}`),
  getByAnimalDate: (farmId, animalId, date) => 
    axios.get(`${API_BASE}`, { params: { farmId, animalId, date } }),
  listByDate: (farmId, date) => 
    axios.get(`${API_BASE}`, { params: { farmId, date } }),
  listByAnimalRange: (farmId, animalId, startDate, endDate) =>
    axios.get(`${API_BASE}/animal`, { params: { farmId, animalId, startDate, endDate } }),
  delete: (id) => axios.delete(`${API_BASE}/${id}`)
};

export default milkApi;
