'use client';

import { Paper, Typography } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useServiceAccountStore } from '../store/useServiceAccountStore';

export default function PlatformAnalysis() {
  const { filteredData, setFilter } = useServiceAccountStore();

  // Process data to get platform distribution
  const processPlatformData = () => {
    const platformCounts = filteredData.reduce((acc: any, account: any) => {
      const platform = account.sa_platform || 'Unknown';
      acc[platform] = (acc[platform] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(platformCounts).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const platformData = processPlatformData();

  const COLORS = ['#D4001A', '#FFA000', '#2E7D32', '#1976D2', '#9C27B0'];

  // Handle click on pie slice for filtering
  const handlePieClick = (data: any) => {
    setFilter({ platform: data.name });
  };

  return (
    <Paper sx={{ p: 3, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        Platform Distribution
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={platformData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            onClick={handlePieClick}
          >
            {platformData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
} 