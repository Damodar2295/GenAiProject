'use client';

import { Paper, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useServiceAccountStore } from '@/store/useServiceAccountStore';

export default function EnvironmentSplit() {
  const { data } = useServiceAccountStore();

  // Process data to get environment distribution
  const processEnvironmentData = () => {
    const environmentCounts = data.reduce((acc: any, account: any) => {
      const environment = account.sa_environment || 'Unknown';
      acc[environment] = (acc[environment] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(environmentCounts).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const environmentData = processEnvironmentData();

  return (
    <Paper sx={{ p: 3, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        Environment Distribution
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={environmentData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#D4001A" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
} 