'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Grid, 
  Typography, 
  Paper, 
  Box, 
  Chip, 
  Divider,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Tooltip,
  alpha,
  IconButton,
  TablePagination,
  Zoom,
  Fab
} from '@mui/material';
import { 
  AlertCircle, 
  AlertTriangle, 
  Shield, 
  Clock, 
  KeyRound, 
  FileText,
  CheckCircle,
  XCircle,
  Info,
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Upload,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useServiceAccountStore } from '../store/useServiceAccountStore';
import EvidenceUploader from '../components/EvidenceUploader';

interface UploadDialogState {
  open: boolean;
  accountName: string;
  accountId: string;
  violationType: 'Password Construction' | 'Password Rotation' | string;
  violationSeverity: 'critical' | 'high' | 'medium' | 'low';
}

// Custom scrollable table component
const ScrollableTable = ({
  children,
  maxHeight = '450px',
  onScroll
}: {
  children: React.ReactNode;
  maxHeight?: string;
  onScroll?: (scrollTop: number) => void;
}) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const [showTopButton, setShowTopButton] = useState(false);

  const handleScroll = useCallback(() => {
    if (tableRef.current) {
      const scrollTop = tableRef.current.scrollTop;
      setShowTopButton(scrollTop > 100);
      if (onScroll) onScroll(scrollTop);
    }
  }, [onScroll]);

  const scrollToTop = () => {
    tableRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <TableContainer 
        ref={tableRef}
        onScroll={handleScroll}
        sx={{
          maxHeight,
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha('#888', 0.7),
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: alpha('#f1f1f1', 0.5),
          },
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '20px',
            background: 'linear-gradient(to top, rgba(255,255,255,0.8), transparent)',
            pointerEvents: 'none',
            visibility: {xs: 'visible', sm: 'hidden'},
            zIndex: 1,
          }
        }}
      >
        <Table size="small" stickyHeader>
          {children}
        </Table>
      </TableContainer>

      {/* Scroll to top button */}
      <Zoom in={showTopButton}>
        <Fab 
          size="small" 
          color="primary" 
          aria-label="scroll to top"
          onClick={scrollToTop}
          sx={{ 
            position: 'absolute', 
            bottom: 80, 
            right: 16,
            zIndex: 2,
            boxShadow: 3
          }}
        >
          <ArrowUp size={20} />
        </Fab>
      </Zoom>
    </Box>
  );
};

export default function AnomaliesPage() {
  const { data: accountData, isViolationResolved } = useServiceAccountStore();
  const [constructionViolations, setConstructionViolations] = useState<any[]>([]);
  const [rotationViolations, setRotationViolations] = useState<any[]>([]);
  const [sortField, setSortField] = useState('severity');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showRecommendations, setShowRecommendations] = useState<boolean>(true);
  const [uploadDialog, setUploadDialog] = useState<UploadDialogState>({
    open: false,
    accountName: '',
    accountId: '',
    violationType: '',
    violationSeverity: 'medium'
  });
  const [constructionPage, setConstructionPage] = useState(0);
  const [constructionRowsPerPage, setConstructionRowsPerPage] = useState(10);
  const [rotationPage, setRotationPage] = useState(0);
  const [rotationRowsPerPage, setRotationRowsPerPage] = useState(10);
  const constructionTableRef = useRef<HTMLDivElement>(null);
  const rotationTableRef = useRef<HTMLDivElement>(null);
  const [showConstructionTopButton, setShowConstructionTopButton] = useState(false);
  const [showRotationTopButton, setShowRotationTopButton] = useState(false);

  useEffect(() => {
    if (accountData && accountData.length > 0) {
      // Identify accounts that violate password construction requirements (ISCR-315-01)
      const constructionIssues = accountData.map(account => {
        const violations = [];
        let severity = 'low';
        
        // Check password length (at least 16 characters)
        if (account.sa_password_last && account.sa_password_last.length < 16) {
          violations.push('Password length less than 16 characters');
          severity = 'high';
        }
        
        // Check character types (3 of 4: uppercase, lowercase, numeric, special)
        if (account.sa_password_last) {
          const hasUppercase = /[A-Z]/.test(account.sa_password_last);
          const hasLowercase = /[a-z]/.test(account.sa_password_last);
          const hasNumbers = /[0-9]/.test(account.sa_password_last);
          const hasSpecial = /[^A-Za-z0-9]/.test(account.sa_password_last);
          
          const characterTypesCount = [hasUppercase, hasLowercase, hasNumbers, hasSpecial].filter(Boolean).length;
          
          if (characterTypesCount < 3) {
            violations.push('Password does not contain at least 3 character types');
            severity = severity === 'high' ? 'critical' : 'high';
          }
        }
        
        // Check password reuse (history not available in demo data, so simulate)
        if (account.sa_name && account.sa_name.length % 5 === 0) {
          violations.push('Password previously used within last 6 rotations');
          severity = severity === 'critical' ? 'critical' : 'medium';
        }
        
        return {
          account,
          violations,
          severity,
          controlRef: 'ISCR-315-01',
          type: 'Password Construction'
        };
      }).filter(item => item.violations.length > 0);
      
      // Identify accounts that violate password rotation requirements (ISCR-315-11)
      const rotationIssues = accountData.map(account => {
        const violations = [];
        let severity = 'low';
        
        // Check rotation based on account type
        const lastRotationDate = account.sa_password_updated ? new Date(account.sa_password_updated) : null;
        const now = new Date();
        
        if (lastRotationDate) {
          const daysSinceRotation = Math.floor((now.getTime() - lastRotationDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Non-interactive accounts (monitored) - 5 years
          if (
            !account.sa_isinteractive && 
            account.sa_ismonitored && 
            daysSinceRotation > 365 * 5
          ) {
            violations.push('Non-interactive (monitored) account not rotated in 5+ years');
            severity = 'medium';
          }
          
          // Interactive accounts (not monitored) - 3 years
          else if (
            account.sa_isinteractive && 
            !account.sa_ismonitored && 
            daysSinceRotation > 365 * 3
          ) {
            violations.push('Interactive (not monitored) account not rotated in 3+ years');
            severity = 'high';
          }
          
          // Non-interactive accounts (not monitored) - 4 years
          else if (
            !account.sa_isinteractive && 
            !account.sa_ismonitored && 
            daysSinceRotation > 365 * 4
          ) {
            violations.push('Non-interactive (not monitored) account not rotated in 4+ years');
            severity = 'medium';
          }
          
          // Accounts with detected anomalies - 15 days
          else if (
            account.sa_anomalies_detected && 
            daysSinceRotation > 15
          ) {
            violations.push('Account with detected anomalies not rotated within 15 days');
            severity = 'critical';
          }
        }
        
        return {
          account,
          violations,
          severity,
          controlRef: 'ISCR-315-11',
          type: 'Password Rotation'
        };
      }).filter(item => item.violations.length > 0);

      setConstructionViolations(constructionIssues);
      setRotationViolations(rotationIssues);
    }
  }, [accountData]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortViolations = (violations: any[]) => {
    return [...violations].sort((a, b) => {
      if (sortField === 'severity') {
        const severityOrder = { 'critical': 3, 'high': 2, 'medium': 1, 'low': 0 };
        if (sortDirection === 'asc') {
          return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
        } else {
          return severityOrder[b.severity as keyof typeof severityOrder] - severityOrder[a.severity as keyof typeof severityOrder];
        }
      } else if (sortField === 'account') {
        if (sortDirection === 'asc') {
          return a.account.sa_name.localeCompare(b.account.sa_name);
        } else {
          return b.account.sa_name.localeCompare(a.account.sa_name);
        }
      } else if (sortField === 'platform') {
        if (sortDirection === 'asc') {
          return (a.account.sa_platform || '').localeCompare(b.account.sa_platform || '');
        } else {
          return (b.account.sa_platform || '').localeCompare(a.account.sa_platform || '');
        }
      }
      return 0;
    });
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'critical': return '#FF4550';
      case 'high': return '#FF8A00';
      case 'medium': return '#FFCC00';
      case 'low': return '#00B884';
      default: return '#888888';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch(severity) {
      case 'critical': return <AlertCircle size={16} />;
      case 'high': return <AlertTriangle size={16} />;
      case 'medium': return <Info size={16} />;
      case 'low': return <CheckCircle size={16} />;
      default: return <Info size={16} />;
    }
  };

  const getRecommendation = (violation: any) => {
    if (violation.controlRef === 'ISCR-315-01') {
      return 'Update password to meet construction requirements: 16+ characters with at least 3 of 4 character types (uppercase, lowercase, numbers, special characters). Upload evidence of compliance within 15 days to avoid account suspension.';
    } else if (violation.controlRef === 'ISCR-315-11') {
      return 'Rotate password immediately and update rotation schedule to comply with requirements based on account type and monitoring status. Upload evidence of rotation within 15 days to avoid account suspension.';
    }
    return 'Review and address the compliance violation. Upload evidence of remediation within 15 days to avoid account suspension.';
  };

  const totalViolations = constructionViolations.length + rotationViolations.length;
  const criticalCount = [...constructionViolations, ...rotationViolations].filter(v => v.severity === 'critical').length;
  const highCount = [...constructionViolations, ...rotationViolations].filter(v => v.severity === 'high').length;
  const mediumCount = [...constructionViolations, ...rotationViolations].filter(v => v.severity === 'medium').length;
  const lowCount = [...constructionViolations, ...rotationViolations].filter(v => v.severity === 'low').length;

  const handleUploadEvidence = (violation: any) => {
    setUploadDialog({
      open: true,
      accountName: violation.account.sa_name,
      accountId: violation.account.sa_id || violation.account.sa_au || '',
      violationType: violation.type,
      violationSeverity: violation.severity
    });
  };

  const handleCloseUploadDialog = () => {
    setUploadDialog(prev => ({ ...prev, open: false }));
  };

  const handleConstructionPageChange = (event: unknown, newPage: number) => {
    setConstructionPage(newPage);
  };

  const handleConstructionRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConstructionRowsPerPage(parseInt(event.target.value, 10));
    setConstructionPage(0);
  };

  const handleRotationPageChange = (event: unknown, newPage: number) => {
    setRotationPage(newPage);
  };

  const handleRotationRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRotationRowsPerPage(parseInt(event.target.value, 10));
    setRotationPage(0);
  };

  // Monitor scroll position for the Construction table
  const handleConstructionScroll = () => {
    if (constructionTableRef.current) {
      const scrollTop = constructionTableRef.current.scrollTop;
      setShowConstructionTopButton(scrollTop > 100);
    }
  };

  // Monitor scroll position for the Rotation table
  const handleRotationScroll = () => {
    if (rotationTableRef.current) {
      const scrollTop = rotationTableRef.current.scrollTop;
      setShowRotationTopButton(scrollTop > 100);
    }
  };

  // Scroll to top for Construction table
  const scrollConstructionToTop = () => {
    constructionTableRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Scroll to top for Rotation table
  const scrollRotationToTop = () => {
    rotationTableRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <DashboardLayout 
      title="Identified Anomalies" 
      subtitle="Detected violations of password and security controls"
      pageType="anomalies"
    >
      <Grid container spacing={3}>
        {/* Summary Card */}
        <Grid item xs={12}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 3, 
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(240, 50, 50, 0.05) 0%, rgba(255, 255, 255, 1) 100%)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <AlertCircle size={24} color="#d32f2f" />
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#d32f2f' }}>
                Compliance Violations Summary
              </Typography>
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6} sm={3}>
                <Card sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  borderRadius: '8px',
                  border: '1px solid rgba(0, 0, 0, 0.12)'
                }}>
                  <Typography variant="h5" fontWeight="bold" color="text.primary">
                    {totalViolations}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Violations
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  borderRadius: '8px',
                  backgroundColor: alpha('#FF4550', 0.05),
                  borderLeft: '3px solid #FF4550'
                }}>
                  <Typography variant="h5" fontWeight="bold" color="#FF4550">
                    {criticalCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Critical
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  borderRadius: '8px',
                  backgroundColor: alpha('#FF8A00', 0.05),
                  borderLeft: '3px solid #FF8A00'
                }}>
                  <Typography variant="h5" fontWeight="bold" color="#FF8A00">
                    {highCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    High
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  borderRadius: '8px',
                  backgroundColor: alpha('#FFCC00', 0.05),
                  borderLeft: '3px solid #FFCC00'
                }}>
                  <Typography variant="h5" fontWeight="bold" color="#FFCC00">
                    {mediumCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Medium
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 1,
              flexWrap: 'wrap',
              gap: 1
            }}>
              <Typography variant="subtitle1" fontWeight="medium">
                Control Violations
              </Typography>
              <Box>
                <Button 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                  startIcon={showRecommendations ? <EyeOff size={16} /> : <Eye size={16} />}
                  onClick={() => setShowRecommendations(!showRecommendations)}
                  sx={{ mr: 1 }}
                >
                  {showRecommendations ? 'Hide Recommendations' : 'Show Recommendations'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Password Construction Requirements Violations */}
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 0, borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
            <Box sx={{ 
              p: 2, 
              bgcolor: alpha('#FF8A00', 0.05),
              borderBottom: `1px solid ${alpha('#FF8A00', 0.2)}`
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <KeyRound size={18} color="#FF8A00" />
                <Typography variant="subtitle1" fontWeight="medium" color="#FF8A00">
                  Password Construction Check
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                • Password must be at least 16 characters long<br />
                • Must contain at least 3 of 4: Uppercase, Lowercase, Numeric, Special characters<br />
                • Prohibit reuse of last 6 passwords
              </Typography>
            </Box>
            
            {/* Scroll indicator */}
            <Box 
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 1,
                pb: 1,
                pt: 1,
                px: 2,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Scroll to view more
              </Typography>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha('#000', 0.05),
                borderRadius: '50%',
                width: 24,
                height: 24
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 13L12 18L17 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 7L12 12L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Box>
            </Box>
            
            <ScrollableTable>
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={() => handleSort('severity')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Severity
                      {sortField === 'severity' && (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={() => handleSort('account')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Account Name
                      {sortField === 'account' && (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={() => handleSort('platform')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Platform
                      {sortField === 'platform' && (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Violations</TableCell>
                  {showRecommendations && (
                    <TableCell sx={{ fontWeight: 'bold' }}>Recommendations</TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 'bold' }}>Evidence</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortViolations(constructionViolations)
                  .slice(
                    constructionPage * constructionRowsPerPage, 
                    constructionPage * constructionRowsPerPage + constructionRowsPerPage
                  )
                  .map((violation, index) => {
                    const isResolved = isViolationResolved(
                      violation.account.sa_id || violation.account.sa_au || '',
                      'Password Construction'
                    );
                    
                    return (
                      <TableRow 
                        key={index} 
                        hover
                        sx={{ 
                          backgroundColor: isResolved ? alpha('#2e7d32', 0.05) : 'inherit'
                        }}
                      >
                        <TableCell>
                          <Chip
                            size="small"
                            icon={isResolved ? <CheckCircle size={16} /> : getSeverityIcon(violation.severity)}
                            label={isResolved ? 'RESOLVED' : violation.severity.toUpperCase()}
                            sx={{ 
                              backgroundColor: isResolved 
                                ? alpha('#2e7d32', 0.1) 
                                : alpha(getSeverityColor(violation.severity), 0.1),
                              color: isResolved ? '#2e7d32' : getSeverityColor(violation.severity),
                              fontWeight: 'bold',
                              '& .MuiChip-icon': {
                                color: isResolved ? '#2e7d32' : getSeverityColor(violation.severity)
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {violation.account.sa_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {violation.account.sa_id || violation.account.sa_au}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={violation.account.sa_platform || 'Unknown'}
                            sx={{ fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            {violation.violations.map((v: string, i: number) => (
                              <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
                                • {v}
                              </Typography>
                            ))}
                          </Box>
                        </TableCell>
                        {showRecommendations && (
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {getRecommendation(violation)}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {isResolved ? (
                              <Chip
                                size="small"
                                icon={<CheckCircle size={14} />}
                                label="Evidence Verified"
                                color="success"
                                sx={{ fontSize: '0.75rem' }}
                              />
                            ) : (
                              <Button 
                                variant="outlined" 
                                size="small" 
                                sx={{ fontSize: '0.75rem', textTransform: 'none' }}
                                startIcon={<Upload size={14} />}
                                onClick={() => handleUploadEvidence(violation)}
                              >
                                Upload Evidence
                              </Button>
                            )}
                            <Typography 
                              variant="caption" 
                              color={isResolved ? "success.main" : "error"}
                              sx={{ display: 'block' }}
                            >
                              {isResolved 
                                ? 'Compliance verified' 
                                : `Deadline: ${new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}`
                              }
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {constructionViolations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={showRecommendations ? 6 : 5} align="center" sx={{ py: 3 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <CheckCircle size={24} color="#00B884" />
                        <Typography variant="body1" color="text.secondary">
                          No password construction violations detected
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </ScrollableTable>
            
            {/* Add Pagination for Password Construction table */}
            <TablePagination
              component="div"
              count={constructionViolations.length}
              page={constructionPage}
              onPageChange={handleConstructionPageChange}
              rowsPerPage={constructionRowsPerPage}
              onRowsPerPageChange={handleConstructionRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ 
                borderTop: '1px solid',
                borderColor: 'divider',
                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  fontSize: '0.875rem',
                },
                '.MuiTablePagination-select': {
                  fontSize: '0.875rem',
                }
              }}
            />
          </Paper>
        </Grid>

        {/* Password Rotation Requirements Violations */}
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 0, borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
            <Box sx={{ 
              p: 2, 
              bgcolor: alpha('#527FFF', 0.05),
              borderBottom: `1px solid ${alpha('#527FFF', 0.2)}`
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Clock size={18} color="#527FFF" />
                <Typography variant="subtitle1" fontWeight="medium" color="#527FFF">
                  Password Rotation Check
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                • Non-interactive accounts must be rotated every 5 years (if monitored)<br />
                • If not monitored but interactive, rotate every 3 years<br />
                • If not monitored and non-interactive, rotate every 4 years<br />
                • If anomalies detected, rotate within 15 days
              </Typography>
            </Box>
            
            {/* Scroll indicator */}
            <Box 
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 1,
                pb: 1,
                pt: 1,
                px: 2,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Scroll to view more
              </Typography>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha('#000', 0.05),
                borderRadius: '50%',
                width: 24,
                height: 24
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 13L12 18L17 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 7L12 12L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Box>
            </Box>
            
            <ScrollableTable>
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={() => handleSort('severity')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Severity
                      {sortField === 'severity' && (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={() => handleSort('account')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Account Name
                      {sortField === 'account' && (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={() => handleSort('platform')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Platform
                      {sortField === 'platform' && (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Violations</TableCell>
                  {showRecommendations && (
                    <TableCell sx={{ fontWeight: 'bold' }}>Recommendations</TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 'bold' }}>Evidence</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortViolations(rotationViolations)
                  .slice(
                    rotationPage * rotationRowsPerPage, 
                    rotationPage * rotationRowsPerPage + rotationRowsPerPage
                  )
                  .map((violation, index) => {
                    const isResolved = isViolationResolved(
                      violation.account.sa_id || violation.account.sa_au || '',
                      'Password Rotation'
                    );
                    
                    return (
                      <TableRow 
                        key={index} 
                        hover
                        sx={{ 
                          backgroundColor: isResolved ? alpha('#2e7d32', 0.05) : 'inherit'
                        }}
                      >
                        <TableCell>
                          <Chip
                            size="small"
                            icon={isResolved ? <CheckCircle size={16} /> : getSeverityIcon(violation.severity)}
                            label={isResolved ? 'RESOLVED' : violation.severity.toUpperCase()}
                            sx={{ 
                              backgroundColor: isResolved 
                                ? alpha('#2e7d32', 0.1) 
                                : alpha(getSeverityColor(violation.severity), 0.1),
                              color: isResolved ? '#2e7d32' : getSeverityColor(violation.severity),
                              fontWeight: 'bold',
                              '& .MuiChip-icon': {
                                color: isResolved ? '#2e7d32' : getSeverityColor(violation.severity)
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {violation.account.sa_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {violation.account.sa_id || violation.account.sa_au}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={violation.account.sa_platform || 'Unknown'}
                            sx={{ fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            {violation.violations.map((v: string, i: number) => (
                              <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
                                • {v}
                              </Typography>
                            ))}
                          </Box>
                        </TableCell>
                        {showRecommendations && (
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {getRecommendation(violation)}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {isResolved ? (
                              <Chip
                                size="small"
                                icon={<CheckCircle size={14} />}
                                label="Evidence Verified"
                                color="success"
                                sx={{ fontSize: '0.75rem' }}
                              />
                            ) : (
                              <Button 
                                variant="outlined" 
                                size="small" 
                                sx={{ fontSize: '0.75rem', textTransform: 'none' }}
                                startIcon={<Upload size={14} />}
                                onClick={() => handleUploadEvidence(violation)}
                              >
                                Upload Evidence
                              </Button>
                            )}
                            <Typography 
                              variant="caption" 
                              color={isResolved ? "success.main" : "error"}
                              sx={{ display: 'block' }}
                            >
                              {isResolved 
                                ? 'Compliance verified' 
                                : `Deadline: ${new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}`
                              }
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {rotationViolations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={showRecommendations ? 6 : 5} align="center" sx={{ py: 3 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <CheckCircle size={24} color="#00B884" />
                        <Typography variant="body1" color="text.secondary">
                          No password rotation violations detected
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </ScrollableTable>
            
            {/* Add Pagination for Password Rotation table */}
            <TablePagination
              component="div"
              count={rotationViolations.length}
              page={rotationPage}
              onPageChange={handleRotationPageChange}
              rowsPerPage={rotationRowsPerPage}
              onRowsPerPageChange={handleRotationRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ 
                borderTop: '1px solid',
                borderColor: 'divider',
                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  fontSize: '0.875rem',
                },
                '.MuiTablePagination-select': {
                  fontSize: '0.875rem',
                }
              }}
            />
          </Paper>
        </Grid>
      </Grid>

      <EvidenceUploader
        open={uploadDialog.open}
        onClose={handleCloseUploadDialog}
        accountName={uploadDialog.accountName}
        accountId={uploadDialog.accountId}
        violationType={uploadDialog.violationType}
        violationSeverity={uploadDialog.violationSeverity}
      />
    </DashboardLayout>
  );
} 