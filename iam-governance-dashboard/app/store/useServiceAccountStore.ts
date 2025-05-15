import { create } from 'zustand';
import { ServiceAccount, FilterState } from '../types';
import { filterData } from '../utils/filterData';

interface ResolvedViolation {
  accountId: string;
  violationType: 'Password Construction' | 'Password Rotation';
  resolvedAt: Date;
  evidence: string; // Description or reference to evidence
}

interface ServiceAccountState {
  data: ServiceAccount[];
  filteredData: ServiceAccount[];
  filters: FilterState;
  resolvedViolations: ResolvedViolation[];
  setData: (data: ServiceAccount[]) => void;
  setFilter: (filter: Partial<FilterState>) => void;
  resetFilters: () => void;
  markViolationResolved: (violation: ResolvedViolation) => void;
  isViolationResolved: (accountId: string, violationType: 'Password Construction' | 'Password Rotation') => boolean;
  refreshStore: () => void;
}

export const useServiceAccountStore = create<ServiceAccountState>((set, get) => ({
  data: [],
  filteredData: [],
  filters: {},
  resolvedViolations: [],
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
  markViolationResolved: (violation) => set((state) => ({
    resolvedViolations: [
      ...state.resolvedViolations,
      { ...violation, resolvedAt: new Date() }
    ]
  })),
  isViolationResolved: (accountId, violationType) => {
    const { resolvedViolations } = get();
    return resolvedViolations.some(
      v => v.accountId === accountId && v.violationType === violationType
    );
  },
  refreshStore: () => set({
    data: [],
    filteredData: [],
    filters: {},
    resolvedViolations: []
  })
})); 