'use client';

import React from 'react';
import { Grid, Typography, Paper, Box } from '@mui/material';
import { useServiceAccountStore } from '../../store/useServiceAccountStore';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ShieldAlert } from 'lucide-react';
import { AuthGuard } from '../../components/AuthGuard';

export default function HighPrivilegePage() {
  const { data } = useServiceAccountStore();
  
  // Filter data for high privilege accounts with proper type handling
  const highPrivilegeAccounts = data.filter(account => {
    // Handle different possible values for sa_isprivileged
    const privilegeValue = account.sa_isprivileged;
    
    if (typeof privilegeValue === 'boolean') {
      return privilegeValue === true;
    }
    
    if (typeof privilegeValue === 'string') {
      // Fix the 'never' type error with proper type assertion and null checks
      const strValue = privilegeValue as string;
      return strValue.toLowerCase() === 'yes' || strValue.toLowerCase() === 'true';
    }
    
    if (typeof privilegeValue === 'number') {
      return privilegeValue === 1;
    }
    
    return false;
  });

  if (!data || data.length === 0) {
    return (
      <AuthGuard>
        <DashboardLayout 
          title="High Privilege Accounts" 
          subtitle="Analysis of service accounts with elevated privileges"
        >
          <LoadingSpinner />
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout 
        title="High Privilege Accounts" 
        subtitle="Analysis of service accounts with elevated privileges"
        pageType="privileged"
      >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                borderRadius: '12px',
                borderLeft: '4px solid #f44336' // Red border for high privilege
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <ShieldAlert size={24} color="#f44336" />
                <Typography variant="h6" fontWeight="bold" color="#f44336">
                  High Privilege Accounts
                </Typography>
              </Box>
              
              <Typography variant="body1" paragraph>
                High privilege accounts have elevated access rights and pose greater security risks.
              </Typography>
              
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: '8px' }}>
                <Typography variant="body2">
                  Total high privilege accounts: <strong>{highPrivilegeAccounts.length}</strong>
                </Typography>
                <Typography variant="body2">
                  Percentage of total: <strong>{Math.round((highPrivilegeAccounts.length / data.length) * 100)}%</strong>
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DashboardLayout>
    </AuthGuard>
  );
} 