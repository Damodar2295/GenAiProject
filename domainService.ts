// domainService.ts
// This service fetches the domain list from a backend API (e.g., MongoDB)

export interface DomainData {
    Domain_Id: number;
    Domain_Code: string;
    Domain_Name: string;
    Sub_Domain_Name: string;
}

/**
 * Fetches the domain list from the backend API (which should query MongoDB).
 * Replace the endpoint URL with your actual backend endpoint.
 */
export async function loadDomainList(): Promise<DomainData[]> {
    const response = await fetch('/api/domains'); // Your backend endpoint
    if (!response.ok) {
        throw new Error('Failed to fetch domain list from server');
    }
    const data: DomainData[] = await response.json();
    return data;
}

// Usage in questionnaireService.ts:
// import { loadDomainList } from './domainService';
// ...
// const domainList = await loadDomainList(); 