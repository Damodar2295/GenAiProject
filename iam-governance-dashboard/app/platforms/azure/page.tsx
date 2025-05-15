'use client';

import React, { useState, useEffect } from 'react';
import { Grid, Typography, Paper, Box, Card, alpha, Divider } from '@mui/material';
import { useServiceAccountStore } from '../../store/useServiceAccountStore';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Cloud, Shield, Server, Database, Clock } from 'lucide-react';
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

// Define Azure brand color
const AZURE_COLOR = '#0078D4';

export default function AzurePlatformPage() {
  const { data } = useServiceAccountStore();
  const theme = useTheme();
  
  // Filter data for Azure accounts
  const azureAccounts = data.filter(account => 
    account.sa_platform === 'Azure' || 
    (typeof account.sa_platform === 'string' && account.sa_platform.toLowerCase().includes('azure'))
  );
  
  // For demo purposes, if no accounts match the filter
  const accountCount = azureAccounts.length > 0 ? azureAccounts.length : Math.floor(data.length * 0.2);

  // Demo data for Azure services distribution
  const azureServicesData = [
    { name: 'Virtual Machines', value: 30, color: '#0078D4' },
    { name: 'Storage Accounts', value: 25, color: '#50E6FF' },
    { name: 'Functions', value: 20, color: '#BAD80A' },
    { name: 'CosmosDB', value: 15, color: '#773ADC' },
    { name: 'SQL Database', value: 10, color: '#FF8C00' },
  ];
  
  // Demo data for Azure regions
  const azureRegionsData = [
    { name: 'East US', value: 35, color: '#0078D4' },
    { name: 'West Europe', value: 25, color: '#50E6FF' },
    { name: 'Southeast Asia', value: 20, color: '#BAD80A' },
    { name: 'UK South', value: 15, color: '#773ADC' },
    { name: 'Central US', value: 5, color: '#FF8C00' },
  ];
  
  // Demo data for Azure account activity
  const azureActivityData = [
    { name: 'Active', value: 70, color: '#36B37E' },
    { name: 'Inactive', value: 30, color: '#FF5630' },
  ];

  // Azure security stats for summary
  const securityStats = {
    compliant: Math.round(accountCount * 0.78),
    nonCompliant: Math.round(accountCount * 0.22),
    mfaEnabled: Math.round(accountCount * 0.88),
    rotationNeeded: Math.round(accountCount * 0.25),
  };

  if (!data || data.length === 0) {
    return (
      <DashboardLayout 
        title="Azure Platform" 
        subtitle="Analysis of Azure service accounts"
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
      title="Azure Platform" 
      subtitle="Analysis of Azure service accounts"
      pageType="platforms"
    >
      <Grid container spacing={3}>
        {/* Azure Overview Card */}
        <Grid item xs={12}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: '12px',
              position: 'relative',
              background: `linear-gradient(135deg, ${alpha(AZURE_COLOR, 0.08)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
              borderLeft: `4px solid ${AZURE_COLOR}`,
              boxShadow: theme.palette.mode === 'dark' ? '0 6px 16px rgba(0,0,0,0.3)' : '0 6px 16px rgba(0,0,0,0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  backgroundColor: alpha(AZURE_COLOR, 0.1),
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Cloud size={20} color={AZURE_COLOR} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: AZURE_COLOR }}>
                  Azure Platform Overview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Comprehensive analysis of Azure service accounts
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
                        icon={<Cloud size={18} />}
                        color={AZURE_COLOR}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <MetricCard
                        value={`${Math.round((accountCount / data.length) * 100)}%`}
                        label="of Total"
                        icon={<Database size={18} />}
                        color={AZURE_COLOR}
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
                            data={azureActivityData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                            stroke={theme.palette.background.paper}
                            strokeWidth={3}
                          >
                            {azureActivityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ClientOnly>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
                    {azureActivityData.map((entry, index) => (
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
              
              {/* Azure Services */}
              <Grid item xs={12} md={4}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Top Azure Services
                  </Typography>
                  <Box sx={{ flexGrow: 1, minHeight: 180 }}>
                    <ClientOnly>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={azureServicesData}
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
                            {azureServicesData.map((entry, index) => (
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
                  {/* Region Distribution */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Azure Region Distribution
                    </Typography>
                    <Box sx={{ height: 220 }}>
                      <ClientOnly>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={azureRegionsData}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              dataKey="value"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {azureRegionsData.map((entry, index) => (
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