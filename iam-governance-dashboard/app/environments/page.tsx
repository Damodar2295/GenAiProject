'use client';

import { useState } from 'react';
import { Grid, Box, Paper, Typography, Container, Button, Stack, Chip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Layers, FileText, Server, Cloud, CodepenIcon, PuzzleIcon } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import EnvironmentSplit from '../components/EnvironmentSplit';
import EnvironmentByPlatform from '../components/EnvironmentByPlatform';
import { useServiceAccountStore } from '../store/useServiceAccountStore';
import DataSetView from '../components/DataSetView';

// Define environment counts interface
interface EnvironmentCounts {
  [key: string]: number;
}

export default function EnvironmentsPage() {
  const theme = useTheme();
  const { data } = useServiceAccountStore();
  const [showDataTable, setShowDataTable] = useState(false);

  // Generate environment statistics
  const total = data.length;
  
  // Mock environment data with proper typing
  const getEnvironmentCounts = (): EnvironmentCounts => {
    // If you have actual sa_environment data
    const envCounts: EnvironmentCounts = data.reduce((acc: EnvironmentCounts, account) => {
      const env = account.sa_environment || 'Not Specified';
      acc[env] = (acc[env] || 0) + 1;
      return acc;
    }, {});
    
    // If no real data, use mock data with realistic distribution
    if (Object.keys(envCounts).length <= 1) {
      return {
        'Production': Math.round(total * 0.35),
        'Pre-Production': Math.round(total * 0.20),
        'Test': Math.round(total * 0.25),
        'Development': Math.round(total * 0.20),
      };
    }
    
    return envCounts;
  };
  
  const environmentCounts = getEnvironmentCounts();
  
  // Stats cards data
  const statCards = [
    { 
      title: 'Total Environments', 
      value: Object.keys(environmentCounts).length, 
      icon: <Layers size={24} />, 
      color: theme.palette.primary.main 
    },
    { 
      title: 'Production', 
      value: environmentCounts['Production'] || 0, 
      icon: <Server size={24} />, 
      color: theme.palette.error.main 
    },
    { 
      title: 'Pre-Production', 
      value: environmentCounts['Pre-Production'] || 0, 
      icon: <Cloud size={24} />, 
      color: theme.palette.warning.main 
    },
    { 
      title: 'Test', 
      value: environmentCounts['Test'] || 0, 
      icon: <CodepenIcon size={24} />, 
      color: theme.palette.info.main 
    },
    { 
      title: 'Development', 
      value: environmentCounts['Development'] || 0, 
      icon: <PuzzleIcon size={24} />, 
      color: theme.palette.success.main 
    },
  ];

  // Environment best practices
  const bestPractices = [
    {
      title: 'Environment Isolation',
      description: 'Keep production separate from non-production with strict access controls',
      status: 'Passed',
      color: theme.palette.success.main
    },
    {
      title: 'Parity Across Environments',
      description: 'Ensure consistent configurations between environments',
      status: 'Warning',
      color: theme.palette.warning.main
    },
    {
      title: 'Privileged Access in Production',
      description: 'Limit privileged access in production environment',
      status: 'Passed',
      color: theme.palette.success.main
    },
    {
      title: 'Environment-specific Credentials',
      description: 'Use separate credentials for each environment',
      status: 'Failed',
      color: theme.palette.error.main
    },
    {
      title: 'Regular Environment Cleanup',
      description: 'Regularly remove unused resources in non-production',
      status: 'Warning',
      color: theme.palette.warning.main
    }
  ];

  return (
    <DashboardLayout 
      title="Environments" 
      subtitle="Analyze service accounts across different environments"
      pageType="environments"
    >
      <Container maxWidth="xl">
        <Box sx={{ p: 2 }}>
          <Grid container spacing={3}>
            {/* Stats Cards */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                {statCards.map((stat, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        borderRadius: '12px',
                        backgroundColor: alpha(stat.color, 0.05),
                        border: `1px solid ${alpha(stat.color, 0.1)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: `0 8px 16px ${alpha(stat.color, 0.15)}`,
                          backgroundColor: alpha(stat.color, 0.08),
                        },
                      }}
                    >
                      <Box 
                        sx={{ 
                          color: stat.color,
                          mb: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {stat.icon}
                      </Box>
                      <Typography variant="h3" fontWeight="bold" align="center" sx={{ color: stat.color }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                        {stat.title}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* Data Table Toggle Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 2 }}>
                <Button 
                  variant="outlined" 
                  color="primary"
                  startIcon={<FileText size={18} />}
                  onClick={() => setShowDataTable(!showDataTable)}
                >
                  {showDataTable ? 'Hide Data Table' : 'Show Data Table'}
                </Button>
              </Box>
            </Grid>

            {/* Environment Distribution */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" color="text.secondary" gutterBottom fontWeight="medium">
                Environment Distribution
              </Typography>
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  height: '100%',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                }}
              >
                <Box sx={{ height: 400 }}>
                  <EnvironmentSplit />
                </Box>
              </Paper>
            </Grid>

            {/* Environment Best Practices */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" color="text.secondary" gutterBottom fontWeight="medium">
                Environment Best Practices
              </Typography>
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  height: '100%',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                }}
              >
                <Stack spacing={2} sx={{ height: '100%' }}>
                  {bestPractices.map((practice, index) => (
                    <Paper
                      key={index}
                      elevation={1}
                      sx={{
                        p: 2,
                        borderRadius: '8px',
                        border: `1px solid ${alpha(practice.color, 0.3)}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(practice.color, 0.05),
                          transform: 'translateX(5px)',
                        }
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {practice.title}
                          </Typography>
                          <Chip 
                            label={practice.status} 
                            size="small" 
                            sx={{ 
                              backgroundColor: alpha(practice.color, 0.1),
                              color: practice.color,
                              fontWeight: 'bold',
                              fontSize: '0.7rem',
                              height: '20px'
                            }} 
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {practice.description}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            </Grid>

            {/* Environment by Platform */}
            <Grid item xs={12}>
              <Typography variant="h6" color="text.secondary" gutterBottom fontWeight="medium" sx={{ mt: 3 }}>
                Environment by Platform
              </Typography>
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                }}
              >
                <Box sx={{ height: 400 }}>
                  <EnvironmentByPlatform />
                </Box>
              </Paper>
            </Grid>

            {/* Data Table Section */}
            {showDataTable && (
              <Grid item xs={12}>
                <Typography variant="h6" color="text.secondary" gutterBottom fontWeight="medium" sx={{ mt: 3 }}>
                  Environment Data
                </Typography>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                  }}
                >
                  <DataSetView />
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      </Container>
    </DashboardLayout>
  );
} 