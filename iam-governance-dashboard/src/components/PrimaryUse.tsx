'use client';

import { Paper, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useServiceAccountStore } from '@/store/useServiceAccountStore';

export default function PrimaryUse() {
  const { data } = useServiceAccountStore();

  // Process data to get primary use distribution
  const processPrimaryUseData = () => {
    const useCounts = data.reduce((acc: any, account: any) => {
      const use = account.sa_primary_use || 'Not Specified';
      acc[use] = (acc[use] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(useCounts)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Show top 10 uses
  };

  const primaryUseData = processPrimaryUseData();

  return (
    <Paper sx={{ p: 3, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        Top 10 Primary Use Cases
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={primaryUseData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={150} />
          <Tooltip />
          <Bar dataKey="value" fill="#D4001A" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
} 