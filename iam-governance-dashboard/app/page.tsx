'use client';

import { useEffect, useState } from 'react';
import { Grid, Box, Paper, Typography, Divider, Container } from '@mui/material';
import { useServiceAccountStore } from './store/useServiceAccountStore';
import { readExcelFile } from './utils/excelReader';
import KPICards from './components/KPICards';
import RequestTrends from './components/RequestTrends';
import PlatformAnalysis from './components/PlatformAnalysis';
import EnvironmentSplit from './components/EnvironmentSplit';
import PrivilegeStatus from './components/PrivilegeStatus';
import PasswordExpiry from './components/PasswordExpiry';
import PrimaryUse from './components/PrimaryUse';
import LoadingSpinner from './components/LoadingSpinner';
import RequestTypeDistribution from './components/RequestTypeDistribution';
import EnvironmentByPlatform from './components/EnvironmentByPlatform';
import ActiveStatusPie from './components/ActiveStatusPie';
import DashboardLayout from './components/DashboardLayout';
import DataSourceSelector from './components/DataSourceSelector';
import DataSetView from './components/DataSetView';
import { Suspense } from 'react';
import { FileText } from 'lucide-react';
import { alpha, useTheme } from '@mui/material/styles';
import { AuthGuard } from './components/AuthGuard';
import TopPlatforms from './components/TopPlatforms';

export default function Dashboard() {
  const { data } = useServiceAccountStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showDataExplorer, setShowDataExplorer] = useState(false);
  const theme = useTheme();

  // Only show loading state initially, then rely on data from the store
  useEffect(() => {
    // Set loading to false once the component is mounted
    setIsLoading(false);
  }, []);

  // Show the data explorer when data is loaded
  useEffect(() => {
    if (data && data.length > 0) {
      setShowDataExplorer(true);
    } else {
      setShowDataExplorer(false);
    }
  }, [data]);

  // Show loading spinner only during initial load
  if (isLoading) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <LoadingSpinner />
      </Suspense>
    );
  }

  // Section heading component for consistent styling
  const SectionHeading = ({ title }: { title: string }) => (
    <Grid item xs={12}>
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h5" fontWeight="600" color="text.secondary">
          {title}
        </Typography>
        <Divider sx={{ mt: 0.5 }} />
      </Box>
    </Grid>
  );

  return (
    <AuthGuard>
      <DashboardLayout 
        title="IAM Governance Dashboard" 
        subtitle="Overview of service account metrics and governance"
      >
        <Container maxWidth="xl">
          <Box sx={{ p: 2 }}>
            <Grid container spacing={3}>
              {/* Data Source Selector */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <DataSourceSelector />
                </Box>
              </Grid>

              {/* Show dashboard only when data is loaded */}
              {data.length > 0 ? (
                <>
                  {/* Dashboard Section Heading */}
                  <Grid item xs={12}>
                    <Box 
                      sx={{ 
                        mt: 1,
                        mb: 3,
                        transition: 'all 0.5s ease-in-out',
                        animation: 'fadeIn 0.8s ease-out',
                        '@keyframes fadeIn': {
                          '0%': {
                            opacity: 0
                          },
                          '100%': {
                            opacity: 1
                          }
                        }
                      }}
                    >
                      <Typography variant="h5" fontWeight="600" color="primary.main">
                        Dashboard Overview
                      </Typography>
                      <Divider sx={{ mt: 0.5 }} />
                    </Box>
                  </Grid>

                  {/* KPI Cards */}
                  <Grid item xs={12}>
                    <Box sx={{ mb: 3 }}>
                      <KPICards />
                    </Box>
                  </Grid>

                  {/* Show Data Explorer view when data is loaded */}
                  {showDataExplorer && (
                    <Grid item xs={12}>
                      <Box 
                        sx={{ 
                          mb: 6,
                          transition: 'all 0.5s ease-in-out',
                          animation: 'slideInUp 0.6s ease-out',
                          '@keyframes slideInUp': {
                            '0%': {
                              opacity: 0,
                              transform: 'translateY(20px)'
                            },
                            '100%': {
                              opacity: 1,
                              transform: 'translateY(0)'
                            }
                          }
                        }}
                      >
                        <Typography variant="h5" fontWeight="600" color="text.secondary" sx={{ mb: 2 }}>
                          Data Explorer
                        </Typography>
                        <DataSetView />
                      </Box>
                    </Grid>
                  )}

                  {/* Service Account Request Overview Section */}
                  <SectionHeading title="Service Account Request Overview" />

                  {/* Request Trends */}
                  <Grid item xs={12}>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: '12px',
                        height: { xs: 'auto', md: 'auto' },
                        minHeight: { xs: 420, md: 450 },
                        display: 'flex',
                        flexDirection: 'column',
                        background: theme => alpha(theme.palette.background.paper, 0.95),
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.05)'
                      }}
                    >
                      <Box sx={{ 
                        flexGrow: 1,
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <RequestTrends />
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {/* Request Type Distribution */}
                  <Grid item xs={12}>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: { xs: 2, sm: 3 }, 
                        borderRadius: '12px',
                        height: { xs: 'auto', md: 'auto' },
                        minHeight: { xs: 450, md: 480 },
                        display: 'flex',
                        flexDirection: 'column',
                        background: theme => alpha(theme.palette.background.paper, 0.95),
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.05)',
                        mt: 4
                      }}
                    >
                      <Box sx={{ 
                        flexGrow: 1,
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <RequestTypeDistribution />
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Platform Analysis Section */}
                  <SectionHeading title="Platform Analysis" />

                  {/* Platform Analysis Row - First Row with Top Platforms and Platform Distribution */}
                  <Grid item xs={12}>
                    <Box sx={{ mb: 3 }}>
                      <Grid 
                        container 
                        spacing={{ xs: 1.5, sm: 2, md: 3 }}
                        alignItems="stretch"
                      >
                        {/* Top Platforms */}
                        <Grid 
                          item 
                          xs={12} 
                          md={6} 
                          lg={6} 
                          sx={{ 
                            display: 'flex',
                            '& > *': { width: '100%' }
                          }}
                        >
                          <Box sx={{ 
                            width: '100%', 
                            height: '100%',
                            maxHeight: '350px',
                            overflow: 'hidden'
                          }}>
                            <TopPlatforms />
                          </Box>
                        </Grid>

                        {/* Platform Distribution */}
                        <Grid 
                          item 
                          xs={12} 
                          md={6} 
                          lg={6}
                          sx={{ 
                            display: 'flex',
                            '& > *': { width: '100%' }
                          }}
                        >
                          <Box sx={{ 
                            width: '100%', 
                            height: '100%',
                            maxHeight: '350px',
                            overflow: 'hidden'
                          }}>
                            <PlatformAnalysis />
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                  
                  {/* Environment Components Row */}
                  <Grid item xs={12}>
                    <Box sx={{ mb: 3 }}>
                      <Grid 
                        container 
                        spacing={{ xs: 1.5, sm: 2, md: 3 }}
                        alignItems="stretch"
                      >
                        {/* Environment by Platform */}
                        <Grid 
                          item 
                          xs={12} 
                          md={6} 
                          lg={6}
                          sx={{ 
                            display: 'flex',
                            '& > *': { width: '100%' }
                          }}
                        >
                          <Box sx={{ 
                            width: '100%', 
                            height: '100%',
                            maxHeight: '350px',
                            overflow: 'hidden'
                          }}>
                            <EnvironmentByPlatform />
                          </Box>
                        </Grid>
                        
                        {/* Environment Split */}
                        <Grid 
                          item 
                          xs={12}
                          md={6}
                          lg={6}
                          sx={{ 
                            display: 'flex',
                            '& > *': { width: '100%' }
                          }}
                        >
                          <Box sx={{ 
                            width: '100%', 
                            height: '100%',
                            maxHeight: '350px',
                            overflow: 'hidden'
                          }}>
                            <EnvironmentSplit />
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>

                  {/* Security & Compliance Section */}
                  <SectionHeading title="Security & Compliance" />

                  {/* Security & Compliance Row - Responsive Grid */}
                  <Grid item xs={12}>
                    <Box sx={{ mb: 3 }}>
                      <Grid 
                        container 
                        spacing={{ xs: 1.5, sm: 2, md: 3 }}
                        alignItems="stretch"
                      >
                        {/* Privilege Status */}
                        <Grid 
                          item 
                          xs={12} 
                          sm={6} 
                          md={4}
                          sx={{ 
                            display: 'flex',
                            '& > *': { width: '100%' }
                          }}
                        >
                          <PrivilegeStatus />
                        </Grid>

                        {/* Active Status */}
                        <Grid 
                          item 
                          xs={12} 
                          sm={6} 
                          md={4}
                          sx={{ 
                            display: 'flex',
                            '& > *': { width: '100%' }
                          }}
                        >
                          <ActiveStatusPie />
                        </Grid>

                        {/* Password Expiry */}
                        <Grid 
                          item 
                          xs={12} 
                          sm={6} 
                          md={4}
                          sx={{ 
                            display: 'flex',
                            '& > *': { width: '100%' }
                          }}
                        >
                          <PasswordExpiry />
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>

                  {/* Account Usage Section */}
                  <SectionHeading title="Account Usage" />

                  {/* Primary Use - Full Width Card */}
                  <Grid item xs={12}>
                    <Box sx={{ mb: 3, display: 'flex' }}>
                      <PrimaryUse />
                    </Box>
                  </Grid>
                </>
              ) : (
                <Grid item xs={12}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 4,
                      mt: 3,
                      textAlign: 'center',
                      borderRadius: '12px',
                      backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.6),
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: (theme) => theme.shadows[4],
                        backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.8),
                      },
                    }}
                  >
                    <Box 
                      sx={{ 
                        mb: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                          mb: 2
                        }}
                      >
                        <FileText size={40} />
                      </Box>
                      <Typography variant="h5" color="primary" gutterBottom fontWeight="bold">
                        No Data Loaded
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                        To begin exploring the IAM Governance Dashboard, please use the Data Source Selector above 
                        to upload an Excel file or generate sample data.
                      </Typography>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          gap: 1, 
                          alignItems: 'center',
                          mt: 1,
                          p: 1,
                          borderRadius: 1,
                          bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                        }}
                      >
                        <Typography variant="caption" color="info.main">
                          <strong>Tip:</strong> Try the "Generate Sample Data" option to quickly see how the dashboard works.
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>
        </Container>
      </DashboardLayout>
    </AuthGuard>
  );
} 