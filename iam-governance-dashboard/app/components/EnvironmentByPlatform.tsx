'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Box, Typography, CircularProgress, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useServiceAccountStore } from '../store/useServiceAccountStore';

export default function EnvironmentByPlatform() {
  const theme = useTheme();
  const { data } = useServiceAccountStore();
  const [chartData, setChartData] = useState<Array<any>>([]);

  // Generate environment by platform data for the chart
  useEffect(() => {
    if (!data || data.length === 0) return;

    // Define common environments and platforms
    const environments = ['Production', 'Pre-Production', 'Test', 'Development', 'Other'];
    const platforms = ['AWS', 'Azure', 'GCP', 'On-Premise', 'Other'];

    // Create a data structure to hold counts by platform and environment
    const platformEnvCounts: Record<string, Record<string, number>> = {};
    
    // Initialize the structure
    platforms.forEach(platform => {
      platformEnvCounts[platform] = {};
      environments.forEach(env => {
        platformEnvCounts[platform][env] = 0;
      });
    });

    // Count accounts by platform and environment
    data.forEach(account => {
      // Determine platform and environment (with defaults)
      const platform = account.sa_platform || determineDefaultPlatform(account);
      const environment = account.sa_environment || determineDefaultEnvironment(account);
      
      // Map to our standard categories
      const mappedPlatform = mapToStandardCategory(platform, platforms);
      const mappedEnv = mapToStandardCategory(environment, environments);
      
      // Increment counter
      platformEnvCounts[mappedPlatform][mappedEnv]++;
    });

    // Transform the data for the stacked bar chart
    const chartData = platforms.map(platform => {
      const result: any = { name: platform };
      environments.forEach(env => {
        result[env] = platformEnvCounts[platform][env];
      });
      return result;
    }).filter(item => {
      // Filter out platforms with no accounts
      return environments.some(env => item[env] > 0);
    });

    setChartData(chartData);
  }, [data]);

  // Helper function to map any value to standard categories
  const mapToStandardCategory = (value: string, standardCategories: string[]): string => {
    // Normalize the value
    const normalizedValue = value.toLowerCase().trim();
    
    // Try to match with standard categories
    for (const category of standardCategories) {
      if (normalizedValue.includes(category.toLowerCase())) {
        return category;
      }
    }
    
    // If no match, return the last category (usually "Other")
    return standardCategories[standardCategories.length - 1];
  };

  // Guess platform based on account name or other properties
  const determineDefaultPlatform = (account: any): string => {
    const name = account.sa_name.toLowerCase();
    
    if (name.includes('aws') || name.includes('amazon')) {
      return 'AWS';
    } else if (name.includes('azure') || name.includes('microsoft')) {
      return 'Azure';
    } else if (name.includes('gcp') || name.includes('google')) {
      return 'GCP';
    } else if (name.includes('onprem') || name.includes('on-prem')) {
      return 'On-Premise';
    }
    
    return 'Other';
  };

  // Guess environment based on account name
  const determineDefaultEnvironment = (account: any): string => {
    const name = account.sa_name.toLowerCase();
    
    if (name.includes('prod') || name.includes('prd')) {
      return 'Production';
    } else if (name.includes('stg') || name.includes('staging') || name.includes('preprod')) {
      return 'Pre-Production';
    } else if (name.includes('test')) {
      return 'Test';
    } else if (name.includes('dev')) {
      return 'Development';
    }
    
    return 'Other';
  };

  // Define colors for environments
  const getEnvironmentColor = (environment: string): string => {
    const colors = {
      'Production': theme.palette.error.main,
      'Pre-Production': theme.palette.warning.main,
      'Test': theme.palette.info.main,
      'Development': theme.palette.success.main,
      'Other': theme.palette.grey[500]
    };
    
    return colors[environment as keyof typeof colors] || theme.palette.grey[500];
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const totalForPlatform = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      
      return (
        <Box
          sx={{
            backgroundColor: alpha('#fff', 0.9),
            p: 1.5,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Platform: {label}
          </Typography>
          
          {payload.map((entry: any, index: number) => (
            <Box 
              key={`tooltip-${index}`} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                mb: 0.5 
              }}
            >
              <Box 
                sx={{ 
                  width: 10, 
                  height: 10, 
                  backgroundColor: entry.color,
                  borderRadius: '2px' 
                }} 
              />
              <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>{entry.name}:</span>
                <span style={{ fontWeight: 'bold', marginLeft: '12px' }}>
                  {entry.value} ({Math.round((entry.value / totalForPlatform) * 100)}%)
                </span>
              </Typography>
            </Box>
          ))}
          
          <Typography variant="body2" sx={{ mt: 0.5, pt: 0.5, borderTop: `1px solid ${theme.palette.divider}` }}>
            Total: <strong>{totalForPlatform}</strong>
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // Loading state
  if (!data || data.length === 0 || chartData.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  // The environments we want to display in the chart
  const environments = ['Production', 'Pre-Production', 'Test', 'Development', 'Other'];

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis type="number" />
          <YAxis 
            dataKey="name" 
            type="category" 
            scale="band" 
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {environments.map((env, index) => (
            <Bar 
              key={`bar-${env}`}
              dataKey={env} 
              stackId="a" 
              fill={getEnvironmentColor(env)}
              name={env}
              radius={index === 0 ? [0, 5, 5, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
} 