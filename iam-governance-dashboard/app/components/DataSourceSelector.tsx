'use client';

import { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  Paper, 
  Typography, 
  CircularProgress, 
  Alert, 
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import { Upload, FileSpreadsheet, RefreshCw, HelpCircle, Database } from 'lucide-react';
import { useServiceAccountStore } from '../store/useServiceAccountStore';
import { readExcelFile } from '../utils/excelReader';
import { parseExcelBuffer } from '../utils/excelParser';
import { ServiceAccount } from '../types';

// Generate sample data for testing
const generateSampleData = (): ServiceAccount[] => {
  const platforms = ['DATABASE', 'ACTIVE_DIRECTORY', 'AWS', 'Azure', 'GCP', 'On-Premise'];
  const environments = ['Production', 'Development', 'Test', 'Staging', 'Pre-Production'];
  const requestTypeOptions = ['New', 'Modify', 'Delete', 'Extend', 'Review'];
  const primaryUses = ['Application', 'Database', 'API', 'Monitoring', 'Automation', 'Integration'];
  const passwordExpiryIntervals = ['30 days', '60 days', '90 days', '180 days', '1 year', 'Never'];
  const formNames = ['SA-Request-Form', 'Cloud-Access-Form', 'Privilege-Request', 'DB-Access-Form'];
  
  // Sample password character sets
  const strongPasswords = [
    'P@ssw0rd1234567890',      // 16+ chars, 3 types
    'Str0ng#P@ssw0rd2023!',    // 16+ chars, 4 types
    'Secur1ty!C0mpl3x2023',    // 16+ chars, 4 types
    'L0ngP@ssw0rdExample',     // 16+ chars, 3 types
    'My$ecureP@ssw0rd123'      // 16+ chars, 4 types
  ];
  
  const weakPasswords = [
    'P@ssword123',             // < 16 chars, 3 types
    'Simple123',               // < 16 chars, 2 types
    'qwerty',                  // < 16 chars, 1 type
    'Adm1n',                   // < 16 chars, 2 types
    'Test!234'                 // < 16 chars, 3 types
  ];
  
  const results: ServiceAccount[] = [];
  const now = new Date();
  
  console.log('Generating sample data across months...');
  
  // Generate data over the last 12 months with more requests in recent months
  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    // Calculate the date for this month (going backward from current month)
    const monthDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const monthName = monthDate.toLocaleString('default', { month: 'short' });
    const yearNum = monthDate.getFullYear();
    
    // More records for recent months, less for older months (50-150 range)
    // Between 50-150 records per month with more in recent months
    const baseCount = 50;
    const trendFactor = Math.max(0, 100 - (monthOffset * 8)); // Gradually decrease for older months
    const recordsInMonth = Math.round(baseCount + trendFactor);
    
    console.log(`Generating ${recordsInMonth} records for ${monthName} ${yearNum}`);
    
    // Generate records for this month with request_type distribution
    for (let i = 0; i < recordsInMonth; i++) {
      const isActive = Math.random() > 0.2;
      const isPrivileged = Math.random() > 0.7;
      const isIsraDocumented = Math.random() > 0.3;
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const requestType = requestTypeOptions[Math.floor(Math.random() * requestTypeOptions.length)];
      
      // Add password-related fields for anomaly detection
      const isInteractive = Math.random() > 0.4;
      const isMonitored = Math.random() > 0.3;
      const hasAnomaliesDetected = Math.random() > 0.9; // 10% chance of having anomalies
      
      // Generate a date within this month
      const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
      const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
      const dateAdded = new Date(monthDate.getFullYear(), monthDate.getMonth(), randomDay);
      
      // Create a unique ID that includes the month and a sequential number
      const uniqueId = `SA-${yearNum}${String(monthDate.getMonth() + 1).padStart(2, '0')}-${String(i+1).padStart(4, '0')}`;
      const accountName = `svc-${platform.toLowerCase()}-${Math.floor(Math.random() * 1000)}`;
      
      // Generate password rotation dates - deliberately create some violations
      let passwordUpdatedDate: Date;
      
      // Create password rotation violations for some accounts based on account type
      if (!isMonitored && !isInteractive && Math.random() > 0.7) {
        // Some non-monitored, non-interactive accounts with outdated passwords (> 4 years)
        passwordUpdatedDate = new Date(now.getFullYear() - 5, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      } else if (!isMonitored && isInteractive && Math.random() > 0.8) {
        // Some non-monitored but interactive accounts with outdated passwords (> 3 years)
        passwordUpdatedDate = new Date(now.getFullYear() - 4, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      } else if (isMonitored && !isInteractive && Math.random() > 0.9) {
        // A few monitored non-interactive accounts with outdated passwords (> 5 years)
        passwordUpdatedDate = new Date(now.getFullYear() - 6, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      } else if (hasAnomaliesDetected && Math.random() > 0.7) {
        // Some accounts with anomalies detected but not rotated within 15 days
        passwordUpdatedDate = new Date(now.getTime() - (20 + Math.floor(Math.random() * 30)) * 24 * 60 * 60 * 1000);
      } else {
        // Regular accounts with recent password updates
        passwordUpdatedDate = new Date(now.getTime() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000);
      }
      
      // Deliberately create some password construction violations by using weak passwords
      const useWeakPassword = Math.random() > 0.8; // 20% chance of weak password
      const passwordLastSample = useWeakPassword
        ? weakPasswords[Math.floor(Math.random() * weakPasswords.length)]
        : strongPasswords[Math.floor(Math.random() * strongPasswords.length)];
      
      results.push({
        rcd_added: dateAdded.toISOString(),
        sa_active: isActive,
        sa_isprivileged: isPrivileged,
        sa_platform: platform,
        sa_environment: environments[Math.floor(Math.random() * environments.length)],
        sa_requesttype: requestType,
        sa_primary_use: primaryUses[Math.floor(Math.random() * primaryUses.length)],
        sa_id: uniqueId,
        sa_au: uniqueId,
        sa_name: accountName,
        sa_createdon: dateAdded.toISOString(),
        sa_password_expiration_interval: passwordExpiryIntervals[Math.floor(Math.random() * passwordExpiryIntervals.length)],
        sa_business_justification: `Business need for ${platform} access in ${isPrivileged ? 'privileged' : 'standard'} mode`,
        sa_isisradocumented: isIsraDocumented,
        sa_form_name: formNames[Math.floor(Math.random() * formNames.length)],
        sa_completion_date: new Date(dateAdded.getTime() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
        platformdefined_1_label: 'Department',
        platformdefined_1_value: ['Finance', 'IT', 'HR', 'Marketing', 'Sales'][Math.floor(Math.random() * 5)],
        Database_Brand: platform === 'DATABASE' ? ['Oracle', 'SQL Server', 'MySQL', 'PostgreSQL', 'MongoDB'][Math.floor(Math.random() * 5)] : undefined,
        Database_Name: platform === 'DATABASE' ? `DB-${Math.floor(Math.random() * 1000)}` : undefined,
        Server: platform === 'DATABASE' || platform === 'On-Premise' ? `SVR-${Math.floor(Math.random() * 1000)}` : undefined,
        load_date: new Date().toISOString(),
        request_month: monthName,
        request_year: yearNum,
        
        // Additional fields for anomaly detection
        sa_password_updated: passwordUpdatedDate.toISOString(),
        sa_password_last: passwordLastSample,
        sa_isinteractive: isInteractive,
        sa_ismonitored: isMonitored,
        sa_anomalies_detected: hasAnomaliesDetected
      });
    }
  }
  
  const requestTypeCounts = results.reduce((acc, item) => {
    acc[item.sa_requesttype] = (acc[item.sa_requesttype] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log(`Generated ${results.length} total sample records across 12 months`);
  console.log('Request type distribution:', Object.entries(requestTypeCounts)
    .map(([type, count]) => `${type}: ${count} (${Math.round((count * 100) / results.length)}%)`)
    .join(', '));
    
  return results;
};

export default function DataSourceSelector() {
  const { setData, data } = useServiceAccountStore();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    
    if (selectedFile) {
      handleFileUpload(selectedFile);
    }
  };

  const handleFileUpload = async (selectedFile: File) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Check if file is an Excel file
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        throw new Error('Please upload a valid Excel file (.xlsx or .xls)');
      }
      
      // Read the file
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const data = parseExcelBuffer(arrayBuffer);
          setData(data);
          setSuccess(`Successfully loaded ${data.length} records from ${selectedFile.name}`);
        } catch (err) {
          setError(`Failed to process Excel file: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read the file');
        setIsLoading(false);
      };
      
      reader.readAsArrayBuffer(selectedFile);
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const loadSampleData = () => {
    setIsLoading(true);
    setError(null);
    setSuccess('Generating sample data with monthly distribution...');
    
    // Add a small delay to show the loading state and success message
    setTimeout(() => {
      try {
        // Generate sample data
        const sampleData = generateSampleData();
        setData(sampleData);
        setSuccess(`Successfully loaded ${sampleData.length} sample records across 12 months. Check the browser console for more details.`);
      } catch (err) {
        setError(`Failed to generate sample data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }, 500); // Short delay for UI feedback
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderRadius: '12px',
        transition: 'box-shadow 0.3s ease-in-out',
        backgroundColor: theme => theme.palette.mode === 'dark' ? '#2C2C2E' : '#FFFFFF',
        '&:hover': {
          boxShadow: (theme) => theme.shadows[6],
        },
        mb: data && data.length > 0 ? 1 : 3, // Reduced margin when data is loaded
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" fontWeight="bold" color="primary.main">
            Data Source
          </Typography>
          <Tooltip title="Upload your Excel file containing service account data or generate sample data">
            <IconButton size="small">
              <HelpCircle size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <input
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Upload size={18} />}
            onClick={handleButtonClick}
            disabled={isLoading}
          >
            Upload Excel File
          </Button>
          
          <Button
            variant="outlined"
            color="info"
            startIcon={<Database size={18} />}
            onClick={loadSampleData}
            disabled={isLoading}
          >
            Generate Sample Data
          </Button>
        </Box>
        
        {isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
            <CircularProgress size={24} />
            <Typography variant="body2">Loading data...</Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mt: 1 }}>
            {success}
          </Alert>
        )}
        
        {file && !isLoading && !error && (
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileSpreadsheet size={18} />
            <Typography variant="body2">
              Current file: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              color="error"
            >
              <RefreshCw size={16} />
            </IconButton>
          </Box>
        )}
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        The Excel file should contain columns for: rcd_added, sa_active, sa_isprivileged, sa_platform, sa_environment, sa_requesttype, sa_primary_use, etc.
      </Typography>
    </Paper>
  );
} 