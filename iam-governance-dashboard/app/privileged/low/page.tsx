'use client';

import React from 'react';
import { Grid, Typography, Paper, Box } from '@mui/material';
import { useServiceAccountStore } from '../../store/useServiceAccountStore';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ShieldAlert } from 'lucide-react';

export default function LowPrivilegePage() {
  const { data } = useServiceAccountStore();
  
  // Filter data for low privilege accounts
  const lowPrivilegeAccounts = data.filter(account => {
    // For demo purposes, just get a subset of accounts
    return Math.random() > 0.5; // Random sampling for demo
  });

  if (!data || data.length === 0) {
    return (
      <DashboardLayout 
        title="Low Privilege Accounts" 
        subtitle="Analysis of service accounts with basic privileges"
      >
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Low Privilege Accounts" 
      subtitle="Analysis of service accounts with basic privileges"
      pageType="privileged"
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: '12px',
              borderLeft: '4px solid #4caf50' // Green border for low privilege
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <ShieldAlert size={24} color="#4caf50" />
              <Typography variant="h6" fontWeight="bold" color="#4caf50">
                Low Privilege Accounts
              </Typography>
            </Box>
            
            <Typography variant="body1" paragraph>
              Low privilege accounts have minimal access rights and pose lower security risks.
            </Typography>
            
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: '8px' }}>
              <Typography variant="body2">
                Total low privilege accounts: <strong>{lowPrivilegeAccounts.length}</strong>
              </Typography>
              <Typography variant="body2">
                Percentage of total: <strong>{Math.round((lowPrivilegeAccounts.length / data.length) * 100)}%</strong>
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
} 