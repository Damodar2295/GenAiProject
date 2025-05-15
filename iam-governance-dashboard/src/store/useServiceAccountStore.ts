import { create } from 'zustand';
import { ServiceAccount, FilterState } from '../types';
import { filterData } from '../utils/filterData';

interface ServiceAccountState {
  data: ServiceAccount[];
  filteredData: ServiceAccount[];
  filters: FilterState;
  setData: (data: ServiceAccount[]) => void;
  setFilter: (filter: Partial<FilterState>) => void;
  resetFilters: () => void;
}

export const useServiceAccountStore = create<ServiceAccountState>((set, get) => ({
  data: [],
  filteredData: [],
  filters: {},
  setData: (data) => set({ 
    data, 
    filteredData: data 
  }),
  setFilter: (filter) => set((state) => {
    const newFilters = { ...state.filters, ...filter };
    const filteredData = filterData(state.data, newFilters);
    return { 
      filters: newFilters,
      filteredData
    };
  }),
  resetFilters: () => set((state) => ({ 
    filters: {}, 
    filteredData: state.data 
  })),
})); 