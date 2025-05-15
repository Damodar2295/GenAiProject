'use client';

import { useState } from 'react';
import { Grid, Box, Paper, Typography, Container, Button, Stack, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { FileText, Download, Printer, BarChart2, Share2, Calendar, MailIcon } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useServiceAccountStore } from '../store/useServiceAccountStore';

export default function ReportsPage() {
  const theme = useTheme();
  const { data } = useServiceAccountStore();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // Available report types
  const reportTypes = [
    { 
      id: 'accounts-summary',
      title: 'Service Accounts Summary', 
      description: 'Overview of all service accounts with key metrics',
      icon: <FileText size={20} />,
      color: theme.palette.primary.main,
      lastGenerated: '2023-11-15'
    },
    { 
      id: 'privileged-accounts',
      title: 'Privileged Accounts Report', 
      description: 'Detailed analysis of accounts with elevated privileges',
      icon: <BarChart2 size={20} />,
      color: theme.palette.warning.main,
      lastGenerated: '2023-11-10'
    },
    { 
      id: 'expiration-report',
      title: 'Password Expiration Report', 
      description: 'Accounts with credentials expiring in the next 90 days',
      icon: <Calendar size={20} />,
      color: theme.palette.error.main,
      lastGenerated: '2023-11-12'
    },
    { 
      id: 'compliance-report',
      title: 'Compliance Audit Report', 
      description: 'Compliance status of all service accounts',
      icon: <FileText size={20} />,
      color: theme.palette.info.main,
      lastGenerated: '2023-11-05'
    },
    { 
      id: 'inactive-accounts',
      title: 'Inactive Accounts Report', 
      description: 'Accounts with no activity in the last 90 days',
      icon: <FileText size={20} />,
      color: theme.palette.success.main,
      lastGenerated: '2023-11-07'
    },
  ];

  // Scheduled reports
  const scheduledReports = [
    {
      title: 'Weekly Security Summary',
      frequency: 'Weekly',
      nextRun: '2023-11-20',
      recipients: 'security-team@company.com',
      format: 'PDF'
    },
    {
      title: 'Monthly Compliance Report',
      frequency: 'Monthly',
      nextRun: '2023-12-01',
      recipients: 'compliance@company.com, management@company.com',
      format: 'Excel'
    },
    {
      title: 'Quarterly Audit Report',
      frequency: 'Quarterly',
      nextRun: '2024-01-01',
      recipients: 'audit@company.com, management@company.com',
      format: 'PDF'
    },
    {
      title: 'Password Expiry Alerts',
      frequency: 'Daily',
      nextRun: '2023-11-16',
      recipients: 'operations@company.com',
      format: 'Email'
    }
  ];

  // Mock data for report preview
  const getReportPreviewData = () => {
    if (!selectedReport) return null;

    const reportData = {
      'accounts-summary': {
        title: 'Service Accounts Summary',
        metrics: [
          { name: 'Total Accounts', value: data.length },
          { name: 'Active Accounts', value: data.filter(a => a.sa_active).length },
          { name: 'Inactive Accounts', value: data.filter(a => !a.sa_active).length },
          { name: 'Privileged Accounts', value: data.filter(a => a.sa_isprivileged).length },
        ],
        columns: ['Account Name', 'Platform', 'Environment', 'Status', 'Last Used'],
        rows: data.slice(0, 5).map(account => [
          account.sa_name,
          account.sa_platform || 'Not specified',
          account.sa_environment || 'Not specified',
          account.sa_active ? 'Active' : 'Inactive',
          '2023-11-10'
        ])
      },
      'privileged-accounts': {
        title: 'Privileged Accounts Report',
        metrics: [
          { name: 'Total Privileged', value: data.filter(a => a.sa_isprivileged).length },
          { name: 'High Privilege', value: Math.floor(data.filter(a => a.sa_isprivileged).length * 0.3) },
          { name: 'Medium Privilege', value: Math.floor(data.filter(a => a.sa_isprivileged).length * 0.5) },
          { name: 'Low Privilege', value: Math.floor(data.filter(a => a.sa_isprivileged).length * 0.2) },
        ],
        columns: ['Account Name', 'Privilege Level', 'Platform', 'Owner', 'Last Review'],
        rows: data.filter(a => a.sa_isprivileged).slice(0, 5).map(account => [
          account.sa_name,
          'High',
          account.sa_platform || 'Not specified',
          account.sa_owner || 'Not specified',
          '2023-10-15'
        ])
      },
      'expiration-report': {
        title: 'Password Expiration Report',
        metrics: [
          { name: 'Expired', value: Math.floor(data.length * 0.05) },
          { name: 'Expiring < 7 Days', value: Math.floor(data.length * 0.1) },
          { name: 'Expiring < 30 Days', value: Math.floor(data.length * 0.15) },
          { name: 'Expiring < 90 Days', value: Math.floor(data.length * 0.2) },
        ],
        columns: ['Account Name', 'Expires On', 'Days Remaining', 'Environment', 'Owner'],
        rows: data.slice(0, 5).map((account, idx) => [
          account.sa_name,
          '2023-12-' + (5 + idx),
          (20 + idx).toString(),
          account.sa_environment || 'Production',
          account.sa_owner || 'Not specified'
        ])
      },
      'compliance-report': {
        title: 'Compliance Audit Report',
        metrics: [
          { name: 'Compliant', value: Math.floor(data.length * 0.75) },
          { name: 'Non-Compliant', value: Math.floor(data.length * 0.25) },
          { name: 'Pending Review', value: Math.floor(data.length * 0.15) },
          { name: 'Exemptions', value: Math.floor(data.length * 0.05) },
        ],
        columns: ['Account Name', 'Compliance Status', 'Policy Violations', 'Last Audit', 'Remediation'],
        rows: data.slice(0, 5).map((account, idx) => [
          account.sa_name,
          idx % 3 === 0 ? 'Non-Compliant' : 'Compliant',
          idx % 3 === 0 ? '2' : '0',
          '2023-10-01',
          idx % 3 === 0 ? 'Required' : 'None'
        ])
      },
      'inactive-accounts': {
        title: 'Inactive Accounts Report',
        metrics: [
          { name: 'Inactive > 90 Days', value: Math.floor(data.length * 0.15) },
          { name: 'Inactive > 180 Days', value: Math.floor(data.length * 0.08) },
          { name: 'Inactive > 365 Days', value: Math.floor(data.length * 0.03) },
          { name: 'Recommended for Decommission', value: Math.floor(data.length * 0.1) },
        ],
        columns: ['Account Name', 'Last Activity', 'Days Inactive', 'Owner', 'Recommendation'],
        rows: data.filter(a => !a.sa_active).slice(0, 5).map((account, idx) => [
          account.sa_name,
          '2023-07-' + (15 - idx),
          (100 + idx * 10).toString(),
          account.sa_owner || 'Not specified',
          'Decommission'
        ])
      }
    };

    return reportData[selectedReport as keyof typeof reportData];
  };

  const reportPreview = getReportPreviewData();

  return (
    <DashboardLayout 
      title="Reports" 
      subtitle="Generate and schedule IAM governance reports"
      pageType="reports"
    >
      <Container maxWidth="xl">
        <Box sx={{ p: 2 }}>
          <Grid container spacing={3}>
            {/* Available Reports Section */}
            <Grid item xs={12} md={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom fontWeight="medium">
                Available Reports
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
                  {reportTypes.map((report) => (
                    <Paper
                      key={report.id}
                      elevation={selectedReport === report.id ? 3 : 1}
                      sx={{
                        p: 2,
                        borderRadius: '8px',
                        border: `1px solid ${alpha(selectedReport === report.id ? report.color : theme.palette.divider, 0.3)}`,
                        backgroundColor: selectedReport === report.id ? alpha(report.color, 0.05) : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(report.color, 0.05),
                          transform: 'translateX(5px)',
                        }
                      }}
                      onClick={() => setSelectedReport(report.id)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ 
                            color: report.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            {report.icon}
                          </Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {report.title}
                          </Typography>
                        </Box>
                        <Chip 
                          label="Generate" 
                          size="small" 
                          sx={{ 
                            backgroundColor: alpha(report.color, 0.1),
                            color: report.color,
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            height: '20px'
                          }} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReport(report.id);
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {report.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Last generated: {report.lastGenerated}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            </Grid>

            {/* Report Preview Section */}
            <Grid item xs={12} md={8}>
              <Typography variant="h6" color="text.secondary" gutterBottom fontWeight="medium">
                Report Preview
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
                {selectedReport ? (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h5" fontWeight="bold" color="text.primary">
                        {reportPreview?.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          variant="outlined" 
                          color="primary" 
                          size="small" 
                          startIcon={<Download size={16} />}
                        >
                          Export
                        </Button>
                        <Button 
                          variant="outlined" 
                          color="secondary" 
                          size="small" 
                          startIcon={<Printer size={16} />}
                        >
                          Print
                        </Button>
                        <Button 
                          variant="outlined" 
                          color="info" 
                          size="small" 
                          startIcon={<Share2 size={16} />}
                        >
                          Share
                        </Button>
                      </Box>
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      {reportPreview?.metrics.map((metric, index) => (
                        <Grid item xs={6} sm={3} key={index}>
                          <Paper
                            elevation={1}
                            sx={{
                              p: 1.5,
                              textAlign: 'center',
                              borderRadius: '8px',
                              border: `1px solid ${theme.palette.divider}`,
                            }}
                          >
                            <Typography variant="h5" fontWeight="bold" color="primary.main">
                              {metric.value}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {metric.name}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>

                    <TableContainer component={Paper} sx={{ mb: 2, boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                            {reportPreview?.columns.map((column, index) => (
                              <TableCell key={index} sx={{ fontWeight: 'bold' }}>
                                {column}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reportPreview?.rows.map((row, rowIndex) => (
                            <TableRow key={rowIndex} sx={{ '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover } }}>
                              {row.map((cell, cellIndex) => (
                                <TableCell key={cellIndex}>
                                  {cell}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
                      Showing 5 of {data.length} records. Generate full report to see all data.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', p: 4 }}>
                    <FileText size={64} color={alpha(theme.palette.text.secondary, 0.2)} />
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 2 }}>
                      Select a report type from the left to preview
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Scheduled Reports Section */}
            <Grid item xs={12}>
              <Typography variant="h6" color="text.secondary" gutterBottom fontWeight="medium" sx={{ mt: 3 }}>
                Scheduled Reports
              </Typography>
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                }}
              >
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableCell>Report Name</TableCell>
                        <TableCell>Frequency</TableCell>
                        <TableCell>Next Run</TableCell>
                        <TableCell>Recipients</TableCell>
                        <TableCell>Format</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {scheduledReports.map((report, index) => (
                        <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover } }}>
                          <TableCell>{report.title}</TableCell>
                          <TableCell>{report.frequency}</TableCell>
                          <TableCell>{report.nextRun}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <MailIcon size={14} style={{ marginRight: '4px' }} />
                              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                {report.recipients}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{report.format}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button 
                                variant="outlined" 
                                color="primary" 
                                size="small" 
                                sx={{ minWidth: '60px', height: '28px', fontSize: '0.75rem' }}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outlined" 
                                color="error" 
                                size="small" 
                                sx={{ minWidth: '60px', height: '28px', fontSize: '0.75rem' }}
                              >
                                Delete
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </DashboardLayout>
  );
} 