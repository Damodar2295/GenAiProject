'use client';

import { useState, useEffect } from 'react';
import { Grid, Box, Paper, Typography, Divider, Container, Button, Chip, Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Users, ShieldCheck, AlertCircle, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import KPICards from '../components/KPICards';
import ActiveStatusPie from '../components/ActiveStatusPie';
import PrimaryUse from '../components/PrimaryUse';
import PasswordExpiry from '../components/PasswordExpiry';
import PrivilegeStatus from '../components/PrivilegeStatus';
import { useServiceAccountStore } from '../store/useServiceAccountStore';
import DataSetView from '../components/DataSetView';

export default function ServiceAccountsPage() {
  const theme = useTheme();
  const { data } = useServiceAccountStore();
  const [showDataTable, setShowDataTable] = useState(false);

  // Calculate service account statistics
  const total = data.length;
  const active = data.filter(account => account.sa_active).length;
  const inactive = total - active;
  const privileged = data.filter(account => account.sa_isprivileged).length;
  const nonPrivileged = total - privileged;
  const expiringSoon = data.filter(account => {
    const expiryDate = new Date(account.sa_password_expiry);
    const now = new Date();
    const days = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return days >= 0 && days <= 30;
  }).length;

  // Stats cards data
  const statCards = [
    { 
      title: 'Total Service Accounts', 
      value: total, 
      icon: <Users size={20} />, 
      color: theme.palette.primary.main 
    },
    { 
      title: 'Active Accounts', 
      value: active, 
      icon: <CheckCircle size={20} />, 
      color: theme.palette.success.main 
    },
    { 
      title: 'Inactive Accounts', 
      value: inactive, 
      icon: <XCircle size={20} />, 
      color: theme.palette.error.main 
    },
    { 
      title: 'Privileged Accounts', 
      value: privileged, 
      icon: <ShieldCheck size={20} />, 
      color: theme.palette.warning.main 
    },
    { 
      title: 'Expiring in 30 Days', 
      value: expiringSoon, 
      icon: <Clock size={20} />, 
      color: theme.palette.info.main 
    },
  ];

  return (
    <DashboardLayout 
      title="Service Accounts" 
      subtitle="Overview and management of all service accounts"
      pageType="serviceAccounts"
    >
      <Container maxWidth="xl" sx={{ py: 1 }}>
        {/* Stat cards row */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  borderRadius: '10px',
                  backgroundColor: alpha(stat.color, 0.05),
                  border: `1px solid ${alpha(stat.color, 0.1)}`,
                  height: '100%',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: `0 4px 8px ${alpha(stat.color, 0.15)}`,
                    backgroundColor: alpha(stat.color, 0.08),
                  },
                }}
              >
                <Box 
                  sx={{ 
                    color: stat.color,
                    mb: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {stat.icon}
                </Box>
                <Typography variant="h5" fontWeight="bold" align="center" sx={{ color: stat.color }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 0.25 }}>
                  {stat.title}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Toggle button for data table */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button 
            variant="outlined" 
            color="primary"
            size="small"
            startIcon={<FileText size={14} />}
            onClick={() => setShowDataTable(!showDataTable)}
          >
            {showDataTable ? 'Hide Data Table' : 'Show Data Table'}
          </Button>
        </Box>

        {/* Status overview section */}
        <Typography variant="h6" color="text.primary" sx={{ mb: 1.5, fontWeight: 500 }}>
          Service Account Status Overview
        </Typography>

        {/* Status visualization charts */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Chart 1: Active Status */}
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={1} 
              sx={{ 
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <Typography 
                variant="subtitle2" 
                color="text.secondary" 
                sx={{ 
                  p: 1.5, 
                  pb: 0.5, 
                  textAlign: 'center',
                  fontWeight: 500
                }}
              >
                Active vs. Inactive Status
              </Typography>
              <Box sx={{ 
                height: 220,
                p: 1,
                pt: 0,
                width: '100%',
                position: 'relative'
              }}>
                <ActiveStatusPie />
              </Box>
            </Paper>
          </Grid>

          {/* Chart 2: Privilege Status */}
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={1} 
              sx={{ 
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <Typography 
                variant="subtitle2" 
                color="text.secondary" 
                sx={{ 
                  p: 1.5, 
                  pb: 0.5, 
                  textAlign: 'center',
                  fontWeight: 500
                }}
              >
                Privilege Distribution
              </Typography>
              <Box sx={{ 
                height: 220,
                p: 1,
                pt: 0,
                width: '100%',
                position: 'relative'
              }}>
                <PrivilegeStatus />
              </Box>
            </Paper>
          </Grid>

          {/* Chart 3: Password Expiry */}
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={1} 
              sx={{ 
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <Typography 
                variant="subtitle2" 
                color="text.secondary" 
                sx={{ 
                  p: 1.5, 
                  pb: 0.5, 
                  textAlign: 'center',
                  fontWeight: 500
                }}
              >
                Password Expiration Status
              </Typography>
              <Box sx={{ 
                height: 220,
                p: 1,
                pt: 0,
                width: '100%',
                position: 'relative'
              }}>
                <PasswordExpiry />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Usage distribution section */}
        <Typography variant="h6" color="text.primary" sx={{ mb: 1.5, fontWeight: 500 }}>
          Account Usage Distribution
        </Typography>
        
        <Paper 
          elevation={1} 
          sx={{ 
            borderRadius: '10px',
            mb: 3,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            height: 300,
            p: 1,
            width: '100%',
            position: 'relative'
          }}>
            <PrimaryUse />
          </Box>
        </Paper>

        {/* Data table section (conditional) */}
        {showDataTable && (
          <>
            <Typography variant="h6" color="text.primary" sx={{ mb: 1.5, fontWeight: 500 }}>
              Service Account Data
            </Typography>
            <Paper 
              elevation={1} 
              sx={{ 
                borderRadius: '10px',
                mb: 2,
                overflow: 'hidden'
              }}
            >
              <Box sx={{ p: 1 }}>
                <DataSetView />
              </Box>
            </Paper>
          </>
        )}
      </Container>
    </DashboardLayout>
  );
} 