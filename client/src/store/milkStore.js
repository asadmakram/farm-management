import { create } from 'zustand';
import milkApi from '../utils/milkApi';

export const useMilkStore = create((set, get) => ({
  entries: [],
  loading: false,
  error: null,
  selectedEntry: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  upsertEntry: async (data) => {
    try {
      set({ loading: true, error: null });
      const response = await milkApi.upsert(data);
      const newEntry = response.data;
      const entries = get().entries.filter(e => e._id !== newEntry._id);
      set({ entries: [newEntry, ...entries], selectedEntry: newEntry });
      return newEntry;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to save entry' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  getEntry: async (farmId, animalId, date) => {
    try {
      set({ loading: true, error: null });
      const response = await milkApi.getByAnimalDate(farmId, animalId, date);
      set({ selectedEntry: response.data });
      return response.data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to fetch entry' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  listByDate: async (farmId, date) => {
    try {
      set({ loading: true, error: null });
      const response = await milkApi.listByDate(farmId, date);
      set({ entries: response.data });
      return response.data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to fetch entries' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  listByAnimalRange: async (farmId, animalId, startDate, endDate) => {
    try {
      set({ loading: true, error: null });
      const response = await milkApi.listByAnimalRange(farmId, animalId, startDate, endDate);
      set({ entries: response.data });
      return response.data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to fetch entries' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  deleteEntry: async (id) => {
    try {
      set({ loading: true, error: null });
      await milkApi.delete(id);
      set({ entries: get().entries.filter(e => e._id !== id) });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to delete entry' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  clearSelected: () => set({ selectedEntry: null })
}));
