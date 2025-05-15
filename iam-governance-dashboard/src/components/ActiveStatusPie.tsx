'use client';

import { Paper, Typography } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useServiceAccountStore } from '../store/useServiceAccountStore';

export default function ActiveStatusPie() {
  const { filteredData, setFilter } = useServiceAccountStore();

  // Process data to get active vs inactive status
  const processActiveStatusData = () => {
    const active = filteredData.filter(account => account.sa_active).length;
    const inactive = filteredData.filter(account => !account.sa_active).length;

    return [
      { name: 'Active', value: active },
      { name: 'Inactive', value: inactive }
    ];
  };

  const activeStatusData = processActiveStatusData();

  const COLORS = ['#2E7D32', '#D32F2F']; // Green for active, Red for inactive

  // Handle click for filtering by active status
  const handlePieClick = (data: any) => {
    // We'd need to extend the FilterState to include activeStatus if we want to filter on this
    // For now, we'll just log the click
    console.log(`Clicked on ${data.name} accounts`);
  };

  return (
    <Paper sx={{ p: 3, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        Active vs Inactive Accounts
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={activeStatusData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            onClick={handlePieClick}
          >
            {activeStatusData.map((entry, index) => (
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