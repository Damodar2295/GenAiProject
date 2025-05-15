'use client';

import { Paper, Typography } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useServiceAccountStore } from '@/store/useServiceAccountStore';

export default function PrivilegeStatus() {
  const { data } = useServiceAccountStore();

  // Process data to get privilege status distribution
  const processPrivilegeData = () => {
    const privilegeCounts = data.reduce((acc: any, account: any) => {
      const status = account.sa_isprivileged ? 'Privileged' : 'Non-Privileged';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(privilegeCounts).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const privilegeData = processPrivilegeData();

  const COLORS = ['#D4001A', '#2E7D32'];

  return (
    <Paper sx={{ p: 3, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        Privilege Status Distribution
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={privilegeData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {privilegeData.map((entry, index) => (
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