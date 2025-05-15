'use client';

import React, { useState, useEffect } from 'react';
import { Grid, Typography, Paper, Box, Card, alpha, Divider } from '@mui/material';
import { useServiceAccountStore } from '../../store/useServiceAccountStore';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Server, Shield, Database, Clock, HardDrive } from 'lucide-react';
import { ClientOnly } from '../../components/ClientOnly';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

// Define On-Premise brand color
const ONPREM_COLOR = '#34A853';

export default function OnPremisePlatformPage() {
  const { data } = useServiceAccountStore();
  const theme = useTheme();
  
  // Filter data for On-Premise accounts
  const onPremAccounts = data.filter(account => 
    account.sa_platform === 'On-Premise' || 
    (typeof account.sa_platform === 'string' && 
      (account.sa_platform.toLowerCase().includes('on-premise') || 
       account.sa_platform.toLowerCase().includes('on premise') ||
       account.sa_platform.toLowerCase().includes('onpremise') ||
       account.sa_platform.toLowerCase().includes('on-prem') ||
       account.sa_platform.toLowerCase().includes('local')))
  );
  
  // For demo purposes, if no accounts match the filter
  const accountCount = onPremAccounts.length > 0 ? onPremAccounts.length : Math.floor(data.length * 0.1);

  // Demo data for On-Premise services distribution
  const onPremServicesData = [
    { name: 'VMs', value: 35, color: '#34A853' },
    { name: 'Databases', value: 30, color: '#EA4335' },
    { name: 'Apps', value: 20, color: '#FBBC05' },
    { name: 'Storage', value: 15, color: '#4285F4' },
  ];
  
  // Demo data for On-Premise locations
  const onPremLocationsData = [
    { name: 'Data Center A', value: 40, color: '#34A853' },
    { name: 'Data Center B', value: 30, color: '#EA4335' },
    { name: 'Branch Offices', value: 20, color: '#FBBC05' },
    { name: 'Colocations', value: 10, color: '#4285F4' },
  ];
  
  // Demo data for On-Premise account activity
  const onPremActivityData = [
    { name: 'Active', value: 65, color: '#36B37E' },
    { name: 'Inactive', value: 35, color: '#FF5630' },
  ];

  // On-Premise security stats for summary
  const securityStats = {
    compliant: Math.round(accountCount * 0.70),
    nonCompliant: Math.round(accountCount * 0.30),
    mfaEnabled: Math.round(accountCount * 0.80),
    rotationNeeded: Math.round(accountCount * 0.35),
  };

  if (!data || data.length === 0) {
    return (
      <DashboardLayout 
        title="On-Premise Platform" 
        subtitle="Analysis of on-premise service accounts"
      >
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <ClientOnly>
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              padding: '12px',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '8px',
              boxShadow: theme.shadows[4],
            }}
          >
            <Typography variant="subtitle2" color="text.primary">
              {payload[0].name}: <strong>{payload[0].value}%</strong>
            </Typography>
          </Box>
        </ClientOnly>
      );
    }
    return null;
  };

  return (
    <DashboardLayout 
      title="On-Premise Platform" 
      subtitle="Analysis of on-premise service accounts"
      pageType="platforms"
    >
      <Grid container spacing={3}>
        {/* On-Premise Overview Card */}
        <Grid item xs={12}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: '12px',
              position: 'relative',
              background: `linear-gradient(135deg, ${alpha(ONPREM_COLOR, 0.08)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
              borderLeft: `4px solid ${ONPREM_COLOR}`,
              boxShadow: theme.palette.mode === 'dark' ? '0 6px 16px rgba(0,0,0,0.3)' : '0 6px 16px rgba(0,0,0,0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  backgroundColor: alpha(ONPREM_COLOR, 0.1),
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Server size={20} color={ONPREM_COLOR} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: ONPREM_COLOR }}>
                  On-Premise Infrastructure Overview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Comprehensive analysis of on-premise service accounts
                </Typography>
              </Box>
            </Box>
            
            <Grid container spacing={3}>
              {/* Key metrics */}
              <Grid item xs={12} md={5}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Key Metrics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <MetricCard
                        value={accountCount}
                        label="Total Accounts"
                        icon={<Server size={18} />}
                        color={ONPREM_COLOR}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <MetricCard
                        value={`${Math.round((accountCount / data.length) * 100)}%`}
                        label="of Total"
                        icon={<Database size={18} />}
                        color={ONPREM_COLOR}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <MetricCard
                        value={securityStats.compliant}
                        label="Compliant"
                        icon={<Shield size={18} />}
                        color="#36B37E"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <MetricCard
                        value={securityStats.rotationNeeded}
                        label="Need Rotation"
                        icon={<Clock size={18} />}
                        color="#FF5630"
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
              
              {/* Activity Status */}
              <Grid item xs={12} md={3}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Activity Status
                  </Typography>
                  <Box sx={{ flexGrow: 1, minHeight: 180 }}>
                    <ClientOnly>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={onPremActivityData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                            stroke={theme.palette.background.paper}
                            strokeWidth={3}
                          >
                            {onPremActivityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ClientOnly>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
                    {onPremActivityData.map((entry, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            backgroundColor: entry.color,
                            borderRadius: '50%',
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {entry.name}: {entry.value}%
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Grid>
              
              {/* On-Premise Services */}
              <Grid item xs={12} md={4}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Top On-Premise Services
                  </Typography>
                  <Box sx={{ flexGrow: 1, minHeight: 180 }}>
                    <ClientOnly>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={onPremServicesData}
                          layout="vertical"
                          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                        >
                          <XAxis type="number" hide />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            tick={{ fontSize: 12 }} 
                            width={100}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" background={{ fill: 'transparent' }}>
                            {onPremServicesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ClientOnly>
                  </Box>
                </Box>
              </Grid>
              
              {/* Additional Information */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                  {/* Location Distribution */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Data Center Distribution
                    </Typography>
                    <Box sx={{ height: 220 }}>
                      <ClientOnly>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={onPremLocationsData}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              dataKey="value"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {onPremLocationsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ClientOnly>
                    </Box>
                  </Box>
                  
                  {/* Security Summary */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Security Summary
                    </Typography>
                    <Box sx={{ p: 2, bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: '8px', mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Compliant:</Typography>
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            {securityStats.compliant} ({Math.round((securityStats.compliant / accountCount) * 100)}%)
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Non-Compliant:</Typography>
                          <Typography variant="body2" fontWeight="bold" color="error.main">
                            {securityStats.nonCompliant} ({Math.round((securityStats.nonCompliant / accountCount) * 100)}%)
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">MFA Enabled:</Typography>
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            {securityStats.mfaEnabled} ({Math.round((securityStats.mfaEnabled / accountCount) * 100)}%)
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Password Rotation Needed:</Typography>
                          <Typography variant="body2" fontWeight="bold" color="warning.main">
                            {securityStats.rotationNeeded} ({Math.round((securityStats.rotationNeeded / accountCount) * 100)}%)
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
}

// Metric Card Component
function MetricCard({ value, label, icon, color }: { value: string | number, label: string, icon: React.ReactNode, color: string }) {
  return (
    <Card
      variant="outlined"
      sx={{
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: '8px',
        borderColor: alpha(color, 0.3),
        backgroundColor: alpha(color, 0.05),
        height: '100%'
      }}
    >
      <Box sx={{ color: color, mb: 1 }}>{icon}</Box>
      <Typography variant="h6" fontWeight="bold" color={color} align="center">
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" align="center">
        {label}
      </Typography>
    </Card>
  );
}

function useTheme() {
  return {
    palette: {
      mode: 'light',
      primary: { main: '#1976d2' },
      error: { main: '#d32f2f' },
      success: { main: '#2e7d32' },
      warning: { main: '#ed6c02' },
      info: { main: '#0288d1' },
      divider: 'rgba(0, 0, 0, 0.12)',
      background: { 
        paper: '#fff',
        default: '#f5f5f5'
      },
      text: {
        primary: 'rgba(0, 0, 0, 0.87)',
        secondary: 'rgba(0, 0, 0, 0.6)'
      }
    },
    shadows: [
      'none',
      '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
      '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
      '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
      '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
    ]
  };
} 