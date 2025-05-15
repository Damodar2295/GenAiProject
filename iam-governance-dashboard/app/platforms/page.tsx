'use client';

import React from 'react';
import { Grid, Typography, Paper, Box } from '@mui/material';
import { useServiceAccountStore } from '../store/useServiceAccountStore';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import PlatformAnalysis from '../components/PlatformAnalysis';
import { Server } from 'lucide-react';

export default function PlatformsPage() {
  const { data } = useServiceAccountStore();

  if (!data || data.length === 0) {
    return (
      <DashboardLayout 
        title="Platforms" 
        subtitle="Analysis of service accounts by platform"
      >
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Platforms" 
      subtitle="Analysis of service accounts by platform"
      pageType="platforms"
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '12px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Server size={24} color="#1976d2" />
              <Typography variant="h6" fontWeight="bold" color="primary">
                Platform Distribution
              </Typography>
            </Box>
            
            <Typography variant="body1" paragraph>
              This page shows the distribution of service accounts across different cloud and on-premise platforms.
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <PlatformAnalysis />
        </Grid>
      </Grid>
    </DashboardLayout>
  );
} 