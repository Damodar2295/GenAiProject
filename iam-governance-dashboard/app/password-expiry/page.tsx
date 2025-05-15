'use client';

import { useState } from 'react';
import { Grid, Box, Paper, Typography, Container, Button, Stack, Chip, Alert } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { KeyRound, FileText, AlertTriangle, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import PasswordExpiry from '../components/PasswordExpiry';
import { useServiceAccountStore } from '../store/useServiceAccountStore';
import DataSetView from '../components/DataSetView';

interface TimeCategory {
  label: string;
  days: number;
  color: string;
  icon: React.ReactNode;
}

export default function PasswordExpiryPage() {
  const theme = useTheme();
  const { data } = useServiceAccountStore();
  const [showDataTable, setShowDataTable] = useState(false);

  // Calculate password expiry statistics
  const total = data.length;

  // Time categories for expiration
  const timeCategories: TimeCategory[] = [
    { 
      label: 'Expired', 
      days: 0, 
      color: theme.palette.error.main,
      icon: <XCircle size={16} />
    },
    { 
      label: 'Expiring in 7 Days', 
      days: 7, 
      color: theme.palette.error.light,
      icon: <AlertTriangle size={16} />
    },
    { 
      label: 'Expiring in 30 Days', 
      days: 30, 
      color: theme.palette.warning.main,
      icon: <Clock size={16} />
    },
    { 
      label: 'Expiring in 90 Days', 
      days: 90, 
      color: theme.palette.info.main,
      icon: <Calendar size={16} />
    },
    { 
      label: 'Valid', 
      days: Infinity, 
      color: theme.palette.success.main,
      icon: <CheckCircle size={16} />
    }
  ];

  // Function to categorize accounts by expiry time
  const categorizeAccountsByExpiry = () => {
    const now = new Date();
    const categories: Record<string, number> = {};
    
    // Initialize categories
    timeCategories.forEach(cat => {
      categories[cat.label] = 0;
    });
    
    // Count accounts in each category
    data.forEach(account => {
      if (!account.sa_password_expiry) {
        categories['Valid'] += 1;
        return;
      }
      
      const expiryDate = new Date(account.sa_password_expiry);
      const daysToExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      
      if (daysToExpiry < 0) {
        categories['Expired'] += 1;
      } else if (daysToExpiry <= 7) {
        categories['Expiring in 7 Days'] += 1;
      } else if (daysToExpiry <= 30) {
        categories['Expiring in 30 Days'] += 1;
      } else if (daysToExpiry <= 90) {
        categories['Expiring in 90 Days'] += 1;
      } else {
        categories['Valid'] += 1;
      }
    });
    
    return categories;
  };
  
  const expiryCategories = categorizeAccountsByExpiry();
  
  // Stats cards data
  const statCards = [
    { 
      title: 'Total Accounts', 
      value: total, 
      icon: <KeyRound size={24} />, 
      color: theme.palette.primary.main 
    },
    { 
      title: 'Expired', 
      value: expiryCategories['Expired'], 
      icon: <XCircle size={24} />, 
      color: theme.palette.error.main 
    },
    { 
      title: 'Expiring (7 Days)', 
      value: expiryCategories['Expiring in 7 Days'], 
      icon: <AlertTriangle size={24} />, 
      color: theme.palette.error.light 
    },
    { 
      title: 'Expiring (30 Days)', 
      value: expiryCategories['Expiring in 30 Days'], 
      icon: <Clock size={24} />, 
      color: theme.palette.warning.main 
    },
    { 
      title: 'Valid Credentials', 
      value: expiryCategories['Valid'] + expiryCategories['Expiring in 90 Days'], 
      icon: <CheckCircle size={24} />, 
      color: theme.palette.success.main 
    },
  ];

  // Critical accounts data - accounts that need immediate attention
  const criticalAccounts = [
    {
      name: 'aws-prod-admin-sa',
      environment: 'Production',
      platform: 'AWS',
      expiryStatus: 'Expired',
      daysRemaining: -3,
      color: theme.palette.error.main
    },
    {
      name: 'azure-db-sa',
      environment: 'Production',
      platform: 'Azure',
      expiryStatus: 'Expiring Soon',
      daysRemaining: 2,
      color: theme.palette.error.main
    },
    {
      name: 'gcp-monitoring-sa',
      environment: 'Production',
      platform: 'GCP',
      expiryStatus: 'Expiring Soon',
      daysRemaining: 5,
      color: theme.palette.error.light
    },
    {
      name: 'aws-payment-service-sa',
      environment: 'Production',
      platform: 'AWS',
      expiryStatus: 'Expiring Soon',
      daysRemaining: 6,
      color: theme.palette.error.light
    },
    {
      name: 'on-prem-db-backup-sa',
      environment: 'Production',
      platform: 'On-Premise',
      expiryStatus: 'Expiring Soon',
      daysRemaining: 7,
      color: theme.palette.warning.main
    }
  ];
  
  // Has critical accounts that need immediate attention
  const hasCriticalAccounts = expiryCategories['Expired'] > 0 || expiryCategories['Expiring in 7 Days'] > 0;

  return (
    <DashboardLayout 
      title="Password Expiry" 
      subtitle="Monitor and manage service account password expirations"
      pageType="passwordExpiry"
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

            {/* Warning Alert for Expired Accounts */}
            {hasCriticalAccounts && (
              <Grid item xs={12}>
                <Alert 
                  severity="error" 
                  icon={<AlertTriangle />}
                  sx={{ 
                    borderRadius: '8px',
                    border: `1px solid ${theme.palette.error.light}`,
                    mb: 2 
                  }}
                >
                  <Typography variant="body2">
                    <strong>Critical Alert:</strong> {expiryCategories['Expired']} accounts have expired credentials and {expiryCategories['Expiring in 7 Days']} will expire in the next 7 days. 
                    Immediate credential rotation is required to prevent service disruptions.
                  </Typography>
                </Alert>
              </Grid>
            )}

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

            {/* Password Expiry Distribution */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" color="text.secondary" gutterBottom fontWeight="medium">
                Password Expiry Distribution
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
                  <PasswordExpiry />
                </Box>
              </Paper>
            </Grid>

            {/* Critical Accounts */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" color="text.secondary" gutterBottom fontWeight="medium">
                Critical Accounts
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
                <Stack spacing={2} sx={{ height: '100%', overflow: 'auto' }}>
                  {criticalAccounts.map((account, index) => (
                    <Paper
                      key={index}
                      elevation={1}
                      sx={{
                        p: 2,
                        borderRadius: '8px',
                        border: `1px solid ${alpha(account.color, 0.3)}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(account.color, 0.05),
                          transform: 'translateX(5px)',
                        }
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {account.name}
                          </Typography>
                          <Chip 
                            label={account.expiryStatus} 
                            size="small" 
                            sx={{ 
                              backgroundColor: alpha(account.color, 0.1),
                              color: account.color,
                              fontWeight: 'bold',
                              fontSize: '0.7rem',
                              height: '20px'
                            }} 
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            {account.platform}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {account.environment}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Clock size={14} color={account.color} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 'bold', 
                            color: account.color,
                          }}
                        >
                          {account.daysRemaining < 0 
                            ? `${Math.abs(account.daysRemaining)} days ago` 
                            : `${account.daysRemaining} days left`}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            </Grid>

            {/* Password Policy Recommendations */}
            <Grid item xs={12}>
              <Typography variant="h6" color="text.secondary" gutterBottom fontWeight="medium" sx={{ mt: 3 }}>
                Password Policy Recommendations
              </Typography>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: '12px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                }}
              >
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, borderRadius: '8px', border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
                      <Typography variant="subtitle1" fontWeight="bold" color="primary.main" gutterBottom>
                        Regular Rotation
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Implement a 90-day password rotation policy for all service accounts to reduce the risk of compromised credentials.
                      </Typography>
                      <Chip label="Recommended" size="small" color="primary" />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, borderRadius: '8px', border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}>
                      <Typography variant="subtitle1" fontWeight="bold" color="warning.main" gutterBottom>
                        Automated Alerts
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Set up automated notifications 30, 15, and 7 days before password expiration to prevent unexpected service disruptions.
                      </Typography>
                      <Chip label="Important" size="small" color="warning" />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, borderRadius: '8px', border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
                      <Typography variant="subtitle1" fontWeight="bold" color="success.main" gutterBottom>
                        Managed Identities
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Transition from password-based authentication to managed identities or certificate-based authentication where supported.
                      </Typography>
                      <Chip label="Best Practice" size="small" color="success" />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Data Table Section */}
            {showDataTable && (
              <Grid item xs={12}>
                <Typography variant="h6" color="text.secondary" gutterBottom fontWeight="medium" sx={{ mt: 3 }}>
                  Password Expiry Data
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