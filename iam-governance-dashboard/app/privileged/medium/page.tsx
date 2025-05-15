'use client';

import React from 'react';
import { Grid, Typography, Paper, Box } from '@mui/material';
import { useServiceAccountStore } from '../../store/useServiceAccountStore';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ShieldAlert } from 'lucide-react';

export default function MediumPrivilegePage() {
  const { data } = useServiceAccountStore();
  
  // Filter data for medium privilege accounts
  const mediumPrivilegeAccounts = data.filter(account => {
    // For demo purposes, just get a subset of accounts
    return Math.random() > 0.7; // Random sampling for demo
  });

  if (!data || data.length === 0) {
    return (
      <DashboardLayout 
        title="Medium Privilege Accounts" 
        subtitle="Analysis of service accounts with moderate privileges"
      >
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Medium Privilege Accounts" 
      subtitle="Analysis of service accounts with moderate privileges"
      pageType="privileged"
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: '12px',
              borderLeft: '4px solid #ff9800' // Orange border for medium privilege
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <ShieldAlert size={24} color="#ff9800" />
              <Typography variant="h6" fontWeight="bold" color="#ff9800">
                Medium Privilege Accounts
              </Typography>
            </Box>
            
            <Typography variant="body1" paragraph>
              Medium privilege accounts have moderate access rights that require regular review.
            </Typography>
            
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: '8px' }}>
              <Typography variant="body2">
                Total medium privilege accounts: <strong>{mediumPrivilegeAccounts.length}</strong>
              </Typography>
              <Typography variant="body2">
                Percentage of total: <strong>{Math.round((mediumPrivilegeAccounts.length / data.length) * 100)}%</strong>
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
} 