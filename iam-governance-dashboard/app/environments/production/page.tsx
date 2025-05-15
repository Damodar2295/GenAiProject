'use client';

import React from 'react';
import { Grid, Typography, Paper, Box } from '@mui/material';
import { useServiceAccountStore } from '../../store/useServiceAccountStore';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { GitBranch } from 'lucide-react';

export default function ProductionEnvironmentPage() {
  const { data } = useServiceAccountStore();
  
  // For demo purposes, create sample data
  const productionAccounts = Math.floor(data.length * 0.3); // 30% in Production

  if (!data || data.length === 0) {
    return (
      <DashboardLayout 
        title="Production Environment" 
        subtitle="Analysis of service accounts in Production environment"
      >
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Production Environment" 
      subtitle="Analysis of service accounts in Production environment"
      pageType="environments"
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '12px', borderLeft: '4px solid #2e7d32' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <GitBranch size={24} color="#2e7d32" />
              <Typography variant="h6" fontWeight="bold" style={{ color: '#2e7d32' }}>
                Production Environment Overview
              </Typography>
            </Box>
            
            <Typography variant="body1" paragraph>
              This page shows details about service accounts in the Production environment.
            </Typography>
            
            <Box sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: '8px' }}>
              <Typography variant="body2">
                Total Production accounts: <strong>{productionAccounts}</strong>
              </Typography>
              <Typography variant="body2">
                Percentage of total: <strong>{Math.round((productionAccounts / data.length) * 100)}%</strong>
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
} 