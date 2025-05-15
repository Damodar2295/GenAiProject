import * as XLSX from 'xlsx';
import { ServiceAccount } from '../types';

/**
 * Validates that the uploaded Excel data contains the required columns for ServiceAccount data
 * @param data The parsed Excel data
 * @returns A validation result with success status and optional error message
 */
export function validateServiceAccountData(data: any[]): { valid: boolean; message?: string } {
  if (!data || data.length === 0) {
    return { valid: false, message: 'Excel file contains no data' };
  }

  // Sample the first row to check if it has the required fields
  const firstRow = data[0];
  
  // Define required fields for service account data
  const requiredFields = [
    'rcd_added',
    'sa_active',
    'sa_isprivileged',
    'sa_platform',
    'sa_environment',
    'sa_requesttype'
  ];

  // Check if all required fields exist
  const missingFields = requiredFields.filter(field => !(field in firstRow));
  
  if (missingFields.length > 0) {
    return { 
      valid: false, 
      message: `Missing required columns: ${missingFields.join(', ')}` 
    };
  }

  return { valid: true };
}

/**
 * Processes raw Excel data to ensure it matches the ServiceAccount schema
 * @param rawData The raw data from Excel
 * @returns Processed data that conforms to ServiceAccount type
 */
export function processServiceAccountData(rawData: any[]): ServiceAccount[] {
  return rawData.map(row => {
    // Ensure boolean fields are properly typed
    const processedRow = {
      ...row,
      // Convert to boolean if not already
      sa_active: typeof row.sa_active === 'boolean' ? row.sa_active : row.sa_active === 'true' || row.sa_active === 'yes' || row.sa_active === 1,
      sa_isprivileged: typeof row.sa_isprivileged === 'boolean' ? row.sa_isprivileged : row.sa_isprivileged === 'true' || row.sa_isprivileged === 'yes' || row.sa_isprivileged === 1,
    };
    
    return processedRow as ServiceAccount;
  });
}

/**
 * Parses an ArrayBuffer containing Excel data into a JavaScript array of objects
 * @param buffer The ArrayBuffer containing Excel data
 * @returns Parsed and validated ServiceAccount data
 */
export function parseExcelBuffer(buffer: ArrayBuffer): ServiceAccount[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
  // Validate the data
  const validation = validateServiceAccountData(jsonData);
  if (!validation.valid) {
    throw new Error(validation.message);
  }
  
  // Process the data to match ServiceAccount schema
  return processServiceAccountData(jsonData);
} 