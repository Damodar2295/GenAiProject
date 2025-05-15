'use client';

import { Paper, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useServiceAccountStore } from '@/store/useServiceAccountStore';

export default function PasswordExpiry() {
  const { data } = useServiceAccountStore();

  // Process data to get password expiry distribution
  const processExpiryData = () => {
    const expiryCounts = data.reduce((acc: any, account: any) => {
      const interval = account.sa_password_expiration_interval || 'Not Set';
      acc[interval] = (acc[interval] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(expiryCounts).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const expiryData = processExpiryData();

  return (
    <Paper sx={{ p: 3, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        Password Expiration Intervals
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={expiryData}>
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