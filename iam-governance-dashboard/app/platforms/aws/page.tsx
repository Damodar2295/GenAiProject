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

// Define AWS brand color
const AWS_COLOR = '#FF9900';

export default function AWSPlatformPage() {
  const { data } = useServiceAccountStore();
  const theme = useTheme();
  
  // Filter data for AWS accounts
  const awsAccounts = data.filter(account => 
    account.sa_platform === 'AWS' || 
    (typeof account.sa_platform === 'string' && account.sa_platform.toLowerCase().includes('aws'))
  );
  
  // For demo purposes, if no accounts match the filter
  const accountCount = awsAccounts.length > 0 ? awsAccounts.length : Math.floor(data.length * 0.25);

  // Demo data for AWS services distribution
  const awsServicesData = [
    { name: 'EC2', value: 35, color: '#FF9900' },
    { name: 'S3', value: 25, color: '#FF4F8B' },
    { name: 'Lambda', value: 20, color: '#527FFF' },
    { name: 'DynamoDB', value: 10, color: '#36B37E' },
    { name: 'RDS', value: 10, color: '#00B8D9' },
  ];
  
  // Demo data for AWS regions
  const awsRegionsData = [
    { name: 'us-east-1', value: 40, color: '#FF9900' },
    { name: 'us-west-2', value: 30, color: '#FF4F8B' },
    { name: 'eu-west-1', value: 15, color: '#527FFF' },
    { name: 'ap-southeast-1', value: 10, color: '#36B37E' },
    { name: 'sa-east-1', value: 5, color: '#00B8D9' },
  ];
  
  // Demo data for AWS account activity
  const awsActivityData = [
    { name: 'Active', value: 75, color: '#36B37E' },
    { name: 'Inactive', value: 25, color: '#FF5630' },
  ];

  // AWS security stats for summary
  const securityStats = {
    compliant: Math.round(accountCount * 0.82),
    nonCompliant: Math.round(accountCount * 0.18),
    mfaEnabled: Math.round(accountCount * 0.91),
    rotationNeeded: Math.round(accountCount * 0.22),
  };

  if (!data || data.length === 0) {
    return (
      <DashboardLayout 
        title="AWS Platform" 
        subtitle="Analysis of AWS service accounts"
      >
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
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
      );
    }
    return null;
  };

  return (
    <DashboardLayout 
      title="AWS Platform" 
      subtitle="Analysis of AWS service accounts"
      pageType="platforms"
    >
      <Grid container spacing={3}>
        {/* AWS Overview Card */}
        <Grid item xs={12}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: '12px',
              position: 'relative',
              background: `linear-gradient(135deg, ${alpha(AWS_COLOR, 0.08)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
              borderLeft: `4px solid ${AWS_COLOR}`,
              boxShadow: theme.palette.mode === 'dark' ? '0 6px 16px rgba(0,0,0,0.3)' : '0 6px 16px rgba(0,0,0,0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  backgroundColor: alpha(AWS_COLOR, 0.1),
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Cloud size={20} color={AWS_COLOR} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: AWS_COLOR }}>
                  AWS Platform Overview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Comprehensive analysis of AWS service accounts
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
                        color={AWS_COLOR}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <MetricCard
                        value={`${Math.round((accountCount / data.length) * 100)}%`}
                        label="of Total"
                        icon={<Database size={18} />}
                        color={AWS_COLOR}
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
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={awsActivityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                          stroke={theme.palette.background.paper}
                          strokeWidth={3}
                        >
                          {awsActivityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
                    {awsActivityData.map((entry, index) => (
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
              
              {/* AWS Services */}
              <Grid item xs={12} md={4}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Top AWS Services
                  </Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={awsServicesData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal stroke={alpha(theme.palette.divider, 0.7)} />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          tick={{ fontSize: 12 }}
                          width={80}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="value" 
                          radius={[0, 4, 4, 0]}
                        >
                          {awsServicesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* AWS Regions Card */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: '12px',
              height: '100%',
              boxShadow: theme.palette.mode === 'dark' ? '0 6px 16px rgba(0,0,0,0.3)' : '0 6px 16px rgba(0,0,0,0.1)',
            }}
          >
            <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
              AWS Regions
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Distribution of service accounts across AWS regions
            </Typography>
            
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={awsRegionsData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {awsRegionsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* AWS Security Card */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: '12px',
              height: '100%',
              boxShadow: theme.palette.mode === 'dark' ? '0 6px 16px rgba(0,0,0,0.3)' : '0 6px 16px rgba(0,0,0,0.1)',
            }}
          >
            <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
              AWS Security
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Security metrics for AWS service accounts
            </Typography>
            
            <Grid container spacing={2}>
              {/* Compliance Status */}
              <Grid item xs={12} sm={6}>
                <Card sx={{ 
                  p: 2, 
                  bgcolor: alpha('#36B37E', 0.1), 
                  borderRadius: '8px',
                  border: `1px solid ${alpha('#36B37E', 0.2)}`,
                }}>
                  <Typography variant="subtitle2" color="#36B37E" gutterBottom>
                    Compliance
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" fontWeight="bold">
                      {Math.round((securityStats.compliant / accountCount) * 100)}%
                    </Typography>
                    <Shield size={24} color="#36B37E" />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {securityStats.compliant} of {accountCount} accounts compliant
                  </Typography>
                </Card>
              </Grid>
              
              {/* MFA Status */}
              <Grid item xs={12} sm={6}>
                <Card sx={{ 
                  p: 2, 
                  bgcolor: alpha('#527FFF', 0.1), 
                  borderRadius: '8px',
                  border: `1px solid ${alpha('#527FFF', 0.2)}`,
                }}>
                  <Typography variant="subtitle2" color="#527FFF" gutterBottom>
                    MFA Enabled
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" fontWeight="bold">
                      {Math.round((securityStats.mfaEnabled / accountCount) * 100)}%
                    </Typography>
                    <Server size={24} color="#527FFF" />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {securityStats.mfaEnabled} of {accountCount} accounts with MFA
                  </Typography>
                </Card>
              </Grid>
              
              {/* Password Rotation */}
              <Grid item xs={12} sm={6}>
                <Card sx={{ 
                  p: 2, 
                  bgcolor: alpha('#FF5630', 0.1), 
                  borderRadius: '8px',
                  border: `1px solid ${alpha('#FF5630', 0.2)}`,
                }}>
                  <Typography variant="subtitle2" color="#FF5630" gutterBottom>
                    Password Rotation
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" fontWeight="bold">
                      {securityStats.rotationNeeded}
                    </Typography>
                    <Clock size={24} color="#FF5630" />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Accounts need credential rotation
                  </Typography>
                </Card>
              </Grid>
              
              {/* Recommendations */}
              <Grid item xs={12} sm={6}>
                <Card sx={{ 
                  p: 2, 
                  bgcolor: alpha('#FF9900', 0.1), 
                  borderRadius: '8px',
                  border: `1px solid ${alpha('#FF9900', 0.2)}`,
                }}>
                  <Typography variant="subtitle2" color="#FF9900" gutterBottom>
                    Recommendations
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    • Enable MFA for all accounts<br />
                    • Rotate credentials every 90 days<br />
                    • Review IAM permissions quarterly
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
}

// Metric card component
function MetricCard({ value, label, icon, color }: { value: string | number, label: string, icon: React.ReactNode, color: string }) {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      p: 2, 
      borderRadius: '8px', 
      bgcolor: alpha(color, 0.1),
      border: `1px solid ${alpha(color, 0.2)}`,
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Box sx={{ color: color }}>
          {icon}
        </Box>
      </Box>
      <Typography variant="h5" fontWeight="bold" sx={{ color }}>
        {value}
      </Typography>
    </Box>
  );
}

// Get theme for use
function useTheme() {
  // For simplicity in this example, return a basic theme object
  // In a real implementation, use the MUI useTheme hook
  return {
    palette: {
      primary: { main: '#1976d2', light: '#42a5f5', dark: '#1565c0' },
      background: { paper: '#fff', default: '#f5f5f5' },
      text: { primary: '#333', secondary: '#666' },
      divider: '#e0e0e0',
      error: { main: '#d32f2f' },
      mode: 'light' as 'light' | 'dark',
    },
    spacing: (factor: number) => `${0.5 * factor}rem`,
    shadows: [
      'none',
      '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
      '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
      '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
      '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
      '0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)',
      '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
      '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
      '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
      '0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)',
    ],
  };
} 