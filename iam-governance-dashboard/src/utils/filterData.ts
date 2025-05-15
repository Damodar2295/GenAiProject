import { ServiceAccount } from '../types';

export function filterData(
  data: ServiceAccount[],
  filters: {
    platform?: string;
    environment?: string;
    requestType?: string;
    privilegeStatus?: string;
    dateRange?: [Date, Date];
  }
): ServiceAccount[] {
  return data.filter((account) => {
    // Check platform filter
    if (filters.platform && account.sa_platform !== filters.platform) {
      return false;
    }
    
    // Check environment filter
    if (filters.environment && account.sa_environment !== filters.environment) {
      return false;
    }
    
    // Check request type filter
    if (filters.requestType && account.sa_requesttype !== filters.requestType) {
      return false;
    }
    
    // Check privilege status filter
    if (filters.privilegeStatus) {
      const isPrivileged = account.sa_isprivileged ? 'Privileged' : 'Non-Privileged';
      if (isPrivileged !== filters.privilegeStatus) {
        return false;
      }
    }
    
    // Check date range filter
    if (filters.dateRange && filters.dateRange.length === 2) {
      const accountDate = new Date(account.rcd_added);
      if (accountDate < filters.dateRange[0] || accountDate > filters.dateRange[1]) {
        return false;
      }
    }
    
    return true;
  });
}

export function getFilteredMetrics(data: ServiceAccount[]) {
  return {
    totalAccounts: data.length,
    activeAccounts: data.filter((account) => account.sa_active).length,
    inactiveAccounts: data.filter((account) => !account.sa_active).length,
    privilegedAccounts: data.filter((account) => account.sa_isprivileged).length,
  };
} 