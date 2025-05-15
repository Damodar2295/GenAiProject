'use client';

import { Grid, Paper, Typography, Box, useTheme } from '@mui/material';
import { useServiceAccountStore } from '../store/useServiceAccountStore';
import { Shield, UserCheck, UserMinus, Key } from 'lucide-react';
import { alpha } from '@mui/material/styles';

export default function KPICards() {
  const { filteredData } = useServiceAccountStore();
  const theme = useTheme();

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
      color: theme.palette.primary.main,
      secondaryColor: theme.palette.primary.light,
      icon: <Key size={28} />,
      change: '+5%',
      period: 'vs last month',
    },
    {
      title: 'Active Accounts',
      value: metrics.activeAccounts,
      color: '#2E7D32', // Green
      secondaryColor: '#4CAF50',
      icon: <UserCheck size={28} />,
      change: '+3%',
      period: 'vs last month',
    },
    {
      title: 'Inactive Accounts',
      value: metrics.inactiveAccounts,
      color: '#D32F2F', // Red
      secondaryColor: '#F44336',
      icon: <UserMinus size={28} />,
      change: '-2%',
      period: 'vs last month',
    },
    {
      title: 'Privileged Accounts',
      value: metrics.privilegedAccounts,
      color: '#ED6C02', // Orange
      secondaryColor: '#FF9800',
      icon: <Shield size={28} />,
      change: '0%',
      period: 'vs last month',
    },
  ];

  return (
    <Grid container spacing={2}>
      {kpiCards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Paper
            sx={{
              p: 1.5,
              display: 'flex',
              flexDirection: 'column',
              height: 160,
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: theme => theme.palette.mode === 'dark' ? '#2C2C2E' : '#FFFFFF',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: `0 8px 20px ${alpha(card.color, 0.2)}`,
                backgroundColor: alpha(card.color, 0.12),
              },
            }}
            elevation={3}
          >
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                right: 0, 
                width: '45%', 
                height: '100%', 
                bgcolor: card.color + '10', 
                borderRadius: '50% 0 0 80%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 0,
              }}
            />
            
            <Box sx={{ position: 'absolute', top: 20, right: 25, color: card.color, opacity: 0.8, zIndex: 1 }}>
              {card.icon}
            </Box>
            
            <Typography variant="subtitle1" component="div" sx={{ mb: 1, fontWeight: 'medium', zIndex: 1 }}>
              {card.title}
            </Typography>
            
            <Typography 
              variant="h3" 
              component="div" 
              sx={{ 
                mt: 1, 
                fontWeight: 'bold', 
                color: card.color,
                zIndex: 1
              }}
            >
              {card.value.toLocaleString()}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto', zIndex: 1 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: card.change.includes('+') ? '#2E7D32' : (card.change.includes('-') ? '#D32F2F' : theme.palette.text.secondary)
                }}
              >
                {card.change}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                {card.period}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
} 