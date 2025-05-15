'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import { useServiceAccountStore } from '../store/useServiceAccountStore';
import { readExcelFile } from '../utils/excelReader';
import DashboardHeader from '../components/DashboardHeader';
import KPICards from '../components/KPICards';
import RequestTrends from '../components/RequestTrends';
import PlatformAnalysis from '../components/PlatformAnalysis';
import EnvironmentSplit from '../components/EnvironmentSplit';
import PrivilegeStatus from '../components/PrivilegeStatus';
import PasswordExpiry from '../components/PasswordExpiry';
import PrimaryUse from '../components/PrimaryUse';
import LoadingSpinner from '../components/LoadingSpinner';
import RequestTypeDistribution from '../components/RequestTypeDistribution';
import EnvironmentByPlatform from '../components/EnvironmentByPlatform';
import ActiveStatusPie from '../components/ActiveStatusPie';
import ResetFiltersButton from '../components/ResetFiltersButton';
import ActiveFilters from '../components/ActiveFilters';
import { Typography } from '@mui/material';

export default function Dashboard() {
  const { setData } = useServiceAccountStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await readExcelFile('/data/realistic_service_account_data.xlsx');
        setData(data);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [setData]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <DashboardHeader />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <ActiveFilters />
          <ResetFiltersButton />
        </Box>
        
        <Grid container spacing={3}>
          {/* KPI Cards */}
          <Grid item xs={12}>
            <KPICards />
          </Grid>

          {/* Service Account Request Overview Section */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom sx={{ mt: 2, color: 'text.secondary' }}>
              Service Account Request Overview
            </Typography>
          </Grid>

          {/* Request Trends */}
          <Grid item xs={12} md={8}>
            <RequestTrends />
          </Grid>

          {/* Request Type Distribution */}
          <Grid item xs={12} md={4}>
            <RequestTypeDistribution />
          </Grid>

          {/* Platform Analysis Section */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom sx={{ mt: 2, color: 'text.secondary' }}>
              Platform Analysis
            </Typography>
          </Grid>

          {/* Platform Analysis */}
          <Grid item xs={12} md={6}>
            <PlatformAnalysis />
          </Grid>

          {/* Environment by Platform */}
          <Grid item xs={12} md={6}>
            <EnvironmentByPlatform />
          </Grid>

          {/* Environment Split */}
          <Grid item xs={12} md={6}>
            <EnvironmentSplit />
          </Grid>

          {/* Security & Compliance Section */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom sx={{ mt: 2, color: 'text.secondary' }}>
              Security & Compliance
            </Typography>
          </Grid>

          {/* Privilege Status */}
          <Grid item xs={12} md={4}>
            <PrivilegeStatus />
          </Grid>

          {/* Active Status */}
          <Grid item xs={12} md={4}>
            <ActiveStatusPie />
          </Grid>

          {/* Password Expiry */}
          <Grid item xs={12} md={4}>
            <PasswordExpiry />
          </Grid>

          {/* Account Usage Section */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom sx={{ mt: 2, color: 'text.secondary' }}>
              Account Usage
            </Typography>
          </Grid>

          {/* Primary Use */}
          <Grid item xs={12} md={12}>
            <PrimaryUse />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
} 