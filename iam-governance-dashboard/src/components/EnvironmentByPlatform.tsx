'use client';

import { Paper, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useServiceAccountStore } from '../store/useServiceAccountStore';

export default function EnvironmentByPlatform() {
  const { filteredData, setFilter } = useServiceAccountStore();

  // Process data to get environment distribution by platform
  const processEnvironmentByPlatformData = () => {
    // First, get all unique platforms and environments
    const platforms = new Set<string>();
    const environments = new Set<string>();
    
    filteredData.forEach(account => {
      const platform = account.sa_platform || 'Unknown';
      const environment = account.sa_environment || 'Unknown';
      platforms.add(platform);
      environments.add(environment);
    });

    // Create a map of platforms to environment counts
    const platformEnvCounts: Record<string, Record<string, number>> = {};
    
    // Initialize the counts object
    platforms.forEach(platform => {
      platformEnvCounts[platform] = {};
      environments.forEach(env => {
        platformEnvCounts[platform][env] = 0;
      });
    });
    
    // Count accounts by platform and environment
    filteredData.forEach(account => {
      const platform = account.sa_platform || 'Unknown';
      const environment = account.sa_environment || 'Unknown';
      platformEnvCounts[platform][environment]++;
    });

    // Convert to Recharts format
    return Array.from(platforms).map(platform => {
      const result: any = { platform };
      environments.forEach(env => {
        result[env] = platformEnvCounts[platform][env];
      });
      return result;
    });
  };

  const chartData = processEnvironmentByPlatformData();
  const environments = Array.from(new Set(filteredData.map(account => account.sa_environment || 'Unknown')));

  // Environmental color mapping
  const envColors: Record<string, string> = {
    Production: '#D4001A', // Wells Fargo Red
    'Pre-Production': '#FFA000', // Gold
    Test: '#2E7D32', // Green
    Development: '#1976D2', // Blue
    Unknown: '#9C27B0', // Purple
  };

  // Handle click on bar for filtering
  const handleBarClick = (data: any, index: number) => {
    setFilter({ platform: data.platform });
  };

  return (
    <Paper sx={{ p: 3, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        Environment Distribution by Platform
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          onClick={handleBarClick}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="platform" />
          <YAxis />
          <Tooltip />
          <Legend />
          {environments.map((env, index) => (
            <Bar 
              key={env} 
              dataKey={env} 
              stackId="a" 
              fill={envColors[env] || `#${Math.floor(Math.random()*16777215).toString(16)}`} 
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
} 