'use client';

import React from 'react';
import { Grid, Typography, Paper, Box } from '@mui/material';
import { useServiceAccountStore } from '../../store/useServiceAccountStore';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { GitBranch } from 'lucide-react';

export default function StagingEnvironmentPage() {
  const { data } = useServiceAccountStore();
  
  // For demo purposes, create sample data
  const stagingAccounts = Math.floor(data.length * 0.2); // 20% in Staging

  if (!data || data.length === 0) {
    return (
      <DashboardLayout 
        title="Staging Environment" 
        subtitle="Analysis of service accounts in Staging environment"
      >
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Staging Environment" 
      subtitle="Analysis of service accounts in Staging environment"
      pageType="environments"
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '12px', borderLeft: '4px solid #f57c00' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <GitBranch size={24} color="#f57c00" />
              <Typography variant="h6" fontWeight="bold" style={{ color: '#f57c00' }}>
                Staging Environment Overview
              </Typography>
            </Box>
            
            <Typography variant="body1" paragraph>
              This page shows details about service accounts in the Staging environment.
            </Typography>
            
            <Box sx={{ p: 2, bgcolor: '#fff8e1', borderRadius: '8px' }}>
              <Typography variant="body2">
                Total Staging accounts: <strong>{stagingAccounts}</strong>
              </Typography>
              <Typography variant="body2">
                Percentage of total: <strong>{Math.round((stagingAccounts / data.length) * 100)}%</strong>
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
} 