'use client';

import React from 'react';
import { Grid, Typography, Paper, Box } from '@mui/material';
import { useServiceAccountStore } from '../../store/useServiceAccountStore';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { GitBranch } from 'lucide-react';

export default function DevelopmentEnvironmentPage() {
  const { data } = useServiceAccountStore();
  
  // For demo purposes, create sample data
  const developmentAccounts = Math.floor(data.length * 0.35); // 35% in Development

  if (!data || data.length === 0) {
    return (
      <DashboardLayout 
        title="Development Environment" 
        subtitle="Analysis of service accounts in Development environment"
      >
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Development Environment" 
      subtitle="Analysis of service accounts in Development environment"
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '12px', borderLeft: '4px solid #1565c0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <GitBranch size={24} color="#1565c0" />
              <Typography variant="h6" fontWeight="bold" style={{ color: '#1565c0' }}>
                Development Environment Overview
              </Typography>
            </Box>
            
            <Typography variant="body1" paragraph>
              This page shows details about service accounts in the Development environment.
            </Typography>
            
            <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: '8px' }}>
              <Typography variant="body2">
                Total Development accounts: <strong>{developmentAccounts}</strong>
              </Typography>
              <Typography variant="body2">
                Percentage of total: <strong>{Math.round((developmentAccounts / data.length) * 100)}%</strong>
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
} 