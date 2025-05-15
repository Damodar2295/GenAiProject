'use client';

import { useState } from 'react';
import { Grid, Box, Paper, Typography, Container, Button, Stack, Chip, Alert } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, FileText, Clock, Users } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import PrivilegeStatus from '../components/PrivilegeStatus';
import PrimaryUse from '../components/PrimaryUse';
import { useServiceAccountStore } from '../store/useServiceAccountStore';
import DataSetView from '../components/DataSetView';

export default function PrivilegedAccessPage() {
  const theme = useTheme();
  const { data, filteredData } = useServiceAccountStore();
  const [showDataTable, setShowDataTable] = useState(false);

  // Calculate privileged account statistics
  const total = data.length;
  const privileged = data.filter(account => account.sa_isprivileged).length;
  const highPrivilege = data.filter(account => account.sa_isprivileged && account.sa_privilegelevel === 'high').length || Math.floor(privileged * 0.3);
  const mediumPrivilege = data.filter(account => account.sa_isprivileged && account.sa_privilegelevel === 'medium').length || Math.floor(privileged * 0.5);
  const lowPrivilege = privileged - highPrivilege - mediumPrivilege;
  
  const privilegePercentage = Math.round((privileged / total) * 100);
  const isHighRatio = privilegePercentage > 30;

  // Stats cards data
  const statCards = [
    { 
      title: 'Total Privileged Accounts', 
      value: privileged, 
      icon: <Shield size={24} />, 
      color: theme.palette.primary.main 
    },
    { 
      title: 'High Privilege', 
      value: highPrivilege, 
      icon: <ShieldAlert size={24} />, 
      color: theme.palette.error.main 
    },
    { 
      title: 'Medium Privilege', 
      value: mediumPrivilege, 
      icon: <ShieldCheck size={24} />, 
      color: theme.palette.warning.main 
    },
    { 
      title: 'Low Privilege', 
      value: lowPrivilege, 
      icon: <Shield size={24} />, 
      color: theme.palette.success.main 
    },
    { 
      title: '% of Total Accounts', 
      value: `${privilegePercentage}%`, 
      icon: <Users size={24} />, 
      color: isHighRatio ? theme.palette.error.main : theme.palette.info.main
    },
  ];

  // Mock risk assessment data
  const riskItems = [
    {
      title: 'Excessive Privilege',
      description: 'Accounts with more privileges than needed for their role',
      count: Math.floor(highPrivilege * 0.4),
      severity: 'high',
      color: theme.palette.error.main
    },
    {
      title: 'Inactive Privileged Accounts',
      description: 'Privileged accounts that haven\'t been used in 90+ days',
      count: Math.floor(privileged * 0.2),
      severity: 'high',
      color: theme.palette.error.main
    },
    {
      title: 'Shared Accounts',
      description: 'Privileged accounts used by multiple people',
      count: Math.floor(privileged * 0.15),
      severity: 'medium',
      color: theme.palette.warning.main
    },
    {
      title: 'Missing MFA',
      description: 'Privileged accounts without multi-factor authentication',
      count: Math.floor(privileged * 0.3),
      severity: 'medium',
      color: theme.palette.warning.main
    },
    {
      title: 'Password Policy Violations',
      description: 'Accounts not adhering to password rotation policies',
      count: Math.floor(privileged * 0.25),
      severity: 'low',
      color: theme.palette.info.main
    }
  ];

  return (
    <DashboardLayout 
      title="Privileged Access" 
      subtitle="Monitor and manage accounts with elevated privileges"
      pageType="privileged"
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

            {/* Warning Alert for High Privilege Ratio */}
            {isHighRatio && (
              <Grid item xs={12}>
                <Alert 
                  severity="warning" 
                  icon={<AlertTriangle />}
                  sx={{ 
                    borderRadius: '8px',
                    border: `1px solid ${theme.palette.warning.light}`,
                    mb: 2 
                  }}
                >
                  <Typography variant="body2">
                    <strong>Security Alert:</strong> Your privileged account percentage ({privilegePercentage}%) is above the recommended threshold (30%). 
                    Consider reviewing access rights to reduce potential security risks.
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

            {/* Privilege Distribution */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" color="text.secondary" gutterBottom fontWeight="medium">
                Privilege Distribution
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
                  <PrivilegeStatus />
                </Box>
              </Paper>
            </Grid>

            {/* Risk Assessment */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" color="text.secondary" gutterBottom fontWeight="medium">
                Risk Assessment
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
                  {riskItems.map((risk, index) => (
                    <Paper
                      key={index}
                      elevation={1}
                      sx={{
                        p: 2,
                        borderRadius: '8px',
                        border: `1px solid ${alpha(risk.color, 0.3)}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(risk.color, 0.05),
                          transform: 'translateX(5px)',
                        }
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {risk.title}
                          </Typography>
                          <Chip 
                            label={risk.severity} 
                            size="small" 
                            sx={{ 
                              backgroundColor: alpha(risk.color, 0.1),
                              color: risk.color,
                              fontWeight: 'bold',
                              fontSize: '0.7rem',
                              height: '20px'
                            }} 
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {risk.description}
                        </Typography>
                      </Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: risk.color,
                          minWidth: '40px',
                          textAlign: 'center'
                        }}
                      >
                        {risk.count}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            </Grid>

            {/* Privileged Account Usage */}
            <Grid item xs={12}>
              <Typography variant="h6" color="text.secondary" gutterBottom fontWeight="medium" sx={{ mt: 3 }}>
                Privileged Account Usage
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
                  <PrimaryUse />
                </Box>
              </Paper>
            </Grid>

            {/* Data Table Section */}
            {showDataTable && (
              <Grid item xs={12}>
                <Typography variant="h6" color="text.secondary" gutterBottom fontWeight="medium" sx={{ mt: 3 }}>
                  Privileged Account Data
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