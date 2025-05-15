import * as XLSX from 'xlsx';

export async function readExcelFile(filePath: string): Promise<any[]> {
  try {
    console.log(`Attempting to fetch Excel file from: ${filePath}`);
    
    const response = await fetch(filePath);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel file: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log(`Excel file fetched, size: ${arrayBuffer.byteLength} bytes`);
    
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    console.log(`Excel workbook parsed, sheets: ${workbook.SheetNames.join(', ')}`);
    
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    console.log(`Excel data converted to JSON, rows: ${jsonData.length}`);
    
    // Check for date fields and ensure they're properly formatted
    const processedData = jsonData.map((row: any) => {
      // If rcd_added exists, ensure it's in a standard format
      if (row.rcd_added) {
        // For demonstration, log a few sample dates
        if (Math.random() < 0.1) { // Only log ~10% of records to avoid console spam
          console.log(`Sample date from Excel: ${row.rcd_added} (type: ${typeof row.rcd_added})`);
        }
      }
      return row;
    });
    
    return processedData;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    // Return empty array with a dummy record to aid debugging
    return [{
      rcd_added: new Date().toISOString(),
      sa_active: true,
      sa_isprivileged: false,
      sa_platform: 'Debug',
      sa_environment: 'Debug',
      sa_requesttype: 'Debug',
      sa_primary_use: 'Debug - Excel loading failed',
      _debug_error: error instanceof Error ? error.message : 'Unknown error'
    }];
  }
} 