'use client';

import { Grid, Paper, Typography, Box } from '@mui/material';
import { useServiceAccountStore } from '../store/useServiceAccountStore';

export default function KPICards() {
  const { filteredData } = useServiceAccountStore();

  const metrics = {
    totalAccounts: filteredData.length,
    activeAccounts: filteredData.filter((account) => account.sa_active).length,
    inactiveAccounts: filteredData.filter((account) => !account.sa_active).length,
    privilegedAccounts: filteredData.filter((account) => account.sa_isprivileged).length,
  };

  const kpiCards = [
    {
      title: 'Total Service Accounts',
      value: metrics.totalAccounts,
      color: '#D4001A', // Wells Fargo Red
    },
    {
      title: 'Active Accounts',
      value: metrics.activeAccounts,
      color: '#2E7D32', // Green
    },
    {
      title: 'Inactive Accounts',
      value: metrics.inactiveAccounts,
      color: '#D32F2F', // Red
    },
    {
      title: 'Privileged Accounts',
      value: metrics.privilegedAccounts,
      color: '#ED6C02', // Orange
    },
  ];

  return (
    <Grid container spacing={3}>
      {kpiCards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              background: `linear-gradient(45deg, ${card.color} 30%, ${card.color}90 90%)`,
              color: 'white',
            }}
            elevation={3}
          >
            <Typography variant="h6" component="div" sx={{ mb: 1 }}>
              {card.title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
              {card.value}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
} 