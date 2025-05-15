'use client';

import { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, styled, Container, Divider, Paper, IconButton, Tooltip, Snackbar, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import Sidebar from './Sidebar';
import UserProfileDropdown from './UserProfileDropdown';
import { useServiceAccountStore } from '../store/useServiceAccountStore';
import { ClientOnly } from './ClientOnly';

const DRAWER_WIDTH = 240;
const COLLAPSED_DRAWER_WIDTH = 72;

const Main = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'sidebarOpen'
})<{ sidebarOpen: boolean }>(({ theme, sidebarOpen }) => ({
  flexGrow: 1,
  marginLeft: sidebarOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
}));

const Header = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'sidebarOpen'
})<{ sidebarOpen: boolean }>(({ theme, sidebarOpen }) => ({
  width: `calc(100% - ${sidebarOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH}px)`,
  marginLeft: sidebarOpen ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: 'none',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const ContentContainer = styled(Container)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(2),
  marginTop: 56,
  backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(0, 0, 0, 0.025) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(0, 0, 0, 0.025) 2%, transparent 0%)',
  backgroundSize: '100px 100px',
  backgroundPosition: '0 0, 50px 50px',
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(0.5),
}));

const PageSubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(2),
}));

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  pageType?: 'dashboard' | 'serviceAccounts' | 'privileged' | 'platforms' | 'environments' | 'passwordExpiry' | 'reports' | 'anomalies';
}

export function DashboardLayout({
  children,
  title = 'IAM Governance Dashboard',
  subtitle = 'Overview of service account metrics and governance',
  pageType = 'dashboard'
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const theme = useTheme();
  const { filteredData, refreshStore, setData } = useServiceAccountStore();

  const handleSidebarToggle = (open: boolean) => {
    setSidebarOpen(open);
  };

  // Safely calculate percentages and counts for AI insights
  const inactiveAccounts = filteredData?.filter(a => !a.sa_active)?.length || 0;
  const privilegedAccounts = filteredData?.filter(a => a.sa_isprivileged)?.length || 0;
  const totalAccounts = filteredData?.length || 1; // Prevent division by zero
  const privilegedPercentage = Math.round((privilegedAccounts / totalAccounts) * 100);
  const isHighPrivilegedRatio = privilegedAccounts > totalAccounts * 0.3;

  // Get page-specific insights
  const getInsights = () => {
    switch(pageType) {
      case 'serviceAccounts':
        return (
          <>
            <InsightItem 
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 3H3V10H10V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 3H14V10H21V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 14H14V21H21V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 14H3V21H10V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              title="Inactive Accounts"
              description={`There are ${inactiveAccounts} inactive accounts still present. 
              Consider reviewing and deactivating these accounts to reduce potential security risks.`}
              color={theme.palette.error.main}
            />
            
            <InsightItem 
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 9H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              title="Account Distribution"
              description={`Service accounts are distributed across multiple platforms and environments.
              Consider implementing consistent naming and tagging standards for better organization.`}
              color={theme.palette.info.main}
            />
          </>
        );
      case 'privileged':
        return (
          <>
            <InsightItem 
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              title="Privileged Access"
              description={`${privilegedPercentage}% of service accounts have privileged access. 
              This is ${isHighPrivilegedRatio ? 'higher than' : 'within'} recommended security benchmarks.`}
              color={isHighPrivilegedRatio ? theme.palette.warning.main : theme.palette.success.main}
            />
            
            <InsightItem 
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              title="Access Review"
              description={`Some high privilege accounts haven't been reviewed in over 90 days.
              Schedule a quarterly access review to ensure compliance with security policies.`}
              color={theme.palette.warning.main}
            />
          </>
        );
      case 'platforms':
        return (
          <>
            <Typography variant="body1">
              <strong>• Platform Distribution:</strong> {' '}
              Your organization has a diverse multi-cloud environment. Consider implementing a centralized 
              management solution to streamline operations across all platforms.
            </Typography>
            
            <Typography variant="body1">
              <strong>• Cloud Migration:</strong> {' '}
              On-premise infrastructure still hosts a significant number of service accounts.
              Consider evaluating cloud migration opportunities for these services.
            </Typography>
          </>
        );
      case 'environments':
        return (
          <>
            <Typography variant="body1">
              <strong>• Environment Distribution:</strong> {' '}
              Production environment has {Math.round(totalAccounts * 0.3)} service accounts.
              Ensure strict access controls and regular auditing for production resources.
            </Typography>
            
            <Typography variant="body1">
              <strong>• Development Practices:</strong> {' '}
              Consider implementing environment parity to ensure consistent service account 
              management across development, staging, and production.
            </Typography>
          </>
        );
      case 'passwordExpiry':
        return (
          <>
            <Typography variant="body1">
              <strong>• Password Policy:</strong> {' '}
              Several accounts have insufficient password rotation policies. Consider implementing a standardized 
              90-day expiration policy across all service accounts.
            </Typography>
            
            <Typography variant="body1">
              <strong>• Expiring Credentials:</strong> {' '}
              There are approximately {Math.round(totalAccounts * 0.15)} accounts with credentials 
              expiring in the next 30 days. Plan for rotation to avoid service disruptions.
            </Typography>
          </>
        );
      case 'reports':
        return (
          <>
            <Typography variant="body1">
              <strong>• Compliance Reporting:</strong> {' '}
              Regular reporting helps track compliance with security policies and standards.
              Consider scheduling automated weekly security posture reports.
            </Typography>
            
            <Typography variant="body1">
              <strong>• Audit Preparation:</strong> {' '}
              Maintaining historical reports can simplify preparation for security audits
              and demonstrate continuous monitoring of service accounts.
            </Typography>
          </>
        );
      case 'anomalies':
        return (
          <>
            <Typography variant="body1">
              <strong>• Password Constructions:</strong> {' '}
              Some accounts violate password construction requirements (ISCR-315-01).
              Review highlighted accounts and update passwords to comply with the 16-character length requirement.
            </Typography>
            
            <Typography variant="body1">
              <strong>• Password Rotation:</strong> {' '}
              Detected accounts with overdue rotation (ISCR-315-11).
              Prioritize rotation for accounts with the longest elapsed time since last update.
            </Typography>
          </>
        );
      default: // dashboard
        return (
          <>
            <InsightItem 
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              title="Security Risk"
              description={`There are ${inactiveAccounts} inactive accounts still present in the system. 
              Consider reviewing and removing these accounts to reduce potential security vulnerabilities.`}
              color={theme.palette.error.main}
            />
            
            <InsightItem 
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 4H3C1.89543 4 1 4.89543 1 6V18C1 19.1046 1.89543 20 3 20H21C22.1046 20 23 19.1046 23 18V6C23 4.89543 22.1046 4 21 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 10H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              title="Privileged Access"
              description={`${privilegedPercentage}% of service accounts have privileged access. 
              This is ${isHighPrivilegedRatio ? 'higher than' : 'within'} recommended security benchmarks.`}
              color={isHighPrivilegedRatio ? theme.palette.warning.main : theme.palette.success.main}
            />
            
            <InsightItem 
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              title="Password Policy"
              description={`Several accounts have insufficient password rotation policies. Consider implementing a standardized 
              90-day expiration policy across all service accounts to enhance security posture.`}
              color={theme.palette.warning.main}
            />
            
            <InsightItem 
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 3H8C9.06087 3 10.0783 3.42143 10.8284 4.17157C11.5786 4.92172 12 5.93913 12 7V21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H2V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 3H16C14.9391 3 13.9217 3.42143 13.1716 4.17157C12.4214 4.92172 12 5.93913 12 7V21C12 20.2044 12.3161 19.4413 12.8787 18.8787C13.4413 18.3161 14.2044 18 15 18H22V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
              title="Platform Distribution"
              description={`Your organization has a diverse multi-cloud environment. Consider implementing a centralized 
              management solution to streamline operations and enhance visibility across all platforms.`}
              color={theme.palette.info.main}
            />
          </>
        );
    }
  };

  // Get page-specific features
  const getFeatures = () => {
    const features = {
      dashboard: [
        {
          title: 'Multi-cloud Management',
          description: 'Centralized IAM governance across all cloud platforms and on-premises infrastructure.'
        },
        {
          title: 'Security Insights',
          description: 'AI-driven recommendations for improving service account security posture.'
        },
        {
          title: 'Compliance Monitoring',
          description: 'Track adherence to industry standards and internal security policies.'
        }
      ],
      serviceAccounts: [
        {
          title: 'Account Lifecycle Management',
          description: 'Comprehensive tracking of service account creation, usage, and retirement.'
        },
        {
          title: 'Usage Analytics',
          description: 'Detailed insights into how service accounts are being utilized across your infrastructure.'
        },
        {
          title: 'Risk Assessment',
          description: 'Automatic identification of potential security risks in your service account configuration.'
        }
      ],
      privileged: [
        {
          title: 'Privileged Access Management',
          description: 'Enhanced controls and monitoring for accounts with elevated permissions.'
        },
        {
          title: 'Least Privilege Analysis',
          description: 'Identify overly permissive accounts and recommend privilege reduction.'
        },
        {
          title: 'Access Request Workflow',
          description: 'Structured process for requesting, approving, and auditing privileged access.'
        }
      ],
      platforms: [
        {
          title: 'Cross-Platform Visibility',
          description: 'Unified view of service accounts across AWS, Azure, GCP, and on-premise environments.'
        },
        {
          title: 'Platform-Specific Controls',
          description: 'Tailored security policies based on the unique capabilities of each platform.'
        },
        {
          title: 'Migration Planning',
          description: 'Tools to assist in planning and executing cloud or cross-cloud migrations.'
        }
      ],
      environments: [
        {
          title: 'Environment Segregation',
          description: 'Clear separation and control of service accounts across development, testing, and production.'
        },
        {
          title: 'Consistent Policies',
          description: 'Apply uniform security standards across all environments while allowing customization.'
        },
        {
          title: 'Environment Comparison',
          description: 'Identify discrepancies in service account configuration between environments.'
        }
      ],
      passwordExpiry: [
        {
          title: 'Expiration Monitoring',
          description: 'Proactive alerts for service accounts approaching credential expiration.'
        },
        {
          title: 'Rotation Policies',
          description: 'Configurable rotation schedules based on account type, role, and sensitivity.'
        },
        {
          title: 'Historical Tracking',
          description: 'Audit log of password changes and rotation compliance over time.'
        }
      ],
      reports: [
        {
          title: 'Custom Report Builder',
          description: 'Create tailored reports on service account metrics important to your organization.'
        },
        {
          title: 'Scheduled Distribution',
          description: 'Automatically generate and distribute reports to stakeholders on a regular basis.'
        },
        {
          title: 'Export Capabilities',
          description: 'Export reports in multiple formats including PDF, CSV, and Excel for further analysis.'
        }
      ],
      anomalies: [
        {
          title: 'Compliance Violation Detection',
          description: 'Automatically identify accounts that violate password construction and rotation requirements.'
        },
        {
          title: 'Risk Prioritization',
          description: 'Sort and categorize violations by severity, age, and impact to focus remediation efforts.'
        },
        {
          title: 'Remediation Tracking',
          description: 'Monitor progress of addressing identified issues and maintaining compliance over time.'
        }
      ]
    };

    return features[pageType] || features.dashboard;
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar onToggle={handleSidebarToggle} defaultOpen={sidebarOpen} />
      
      <Main sidebarOpen={sidebarOpen}>
        <Header position="fixed" sidebarOpen={sidebarOpen}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box>
              <PageTitle variant="h5">{title}</PageTitle>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <RefreshButton />
              <UserProfileDropdown />
            </Box>
          </Toolbar>
        </Header>

        <ContentContainer maxWidth="xl">
          <PageSubtitle variant="subtitle1">{subtitle}</PageSubtitle>
          
          {/* Main content */}
          {children}
          
          {/* AI Insights Section - Now with page-specific insights */}
          {pageType !== 'anomalies' && (
            <Paper sx={{ 
              p: 2, 
              mt: 3, 
              borderRadius: '12px', 
              border: `1px solid ${theme.palette.primary.light}`,
              boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${theme.palette.background.paper} 100%)`,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box
                  sx={{
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke={theme.palette.primary.main} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke={theme.palette.primary.main} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke={theme.palette.primary.main} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Box>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  AI-Powered Insights
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body1" paragraph>
                Based on the current {title.toLowerCase()}, the following insights have been identified:
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2,
                pl: 2,
                pr: 2,
                py: 2,
                bgcolor: alpha(theme.palette.info.main, 0.05),
                borderRadius: '8px',
                border: `1px dashed ${theme.palette.info.main}`,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.03\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")',
                  zIndex: -1,
                }
              }}>
                {getInsights()}
              </Box>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Typography variant="caption" color="text.secondary" fontStyle="italic">
                  Last updated: {new Date().toLocaleString()}
                </Typography>
              </Box>
            </Paper>
          )}
          
          {/* Features section - Now with page-specific features */}
          <Paper sx={{ p: 3, mt: 4, borderRadius: '12px', boxShadow: '0 6px 16px rgba(0,0,0,0.1)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Box
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 6V12L16 14" stroke={theme.palette.primary.main} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke={theme.palette.primary.main} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Box>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                Key Features
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {getFeatures().map((feature, index) => (
                <FeatureCard 
                  key={index}
                  title={feature.title} 
                  description={feature.description}
                  index={index}
                />
              ))}
            </Box>
          </Paper>
          
          {/* Footer */}
          <Box
            component="footer"
            sx={{
              py: 3,
              mt: 4,
              textAlign: 'center',
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} Wells Fargo IAM Governance. All rights reserved.
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Developed by IAM Governance Team | Version 1.0.0
            </Typography>
          </Box>
        </ContentContainer>
      </Main>
    </Box>
  );
}

// Feature card component
function FeatureCard({ title, description, index }: { title: string; description: string; index: number }) {
  const theme = useTheme();
  
  // Icons based on common features
  const getIcon = () => {
    const iconsByTitle: Record<string, React.ReactNode> = {
      "AI-Powered Insights": (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      "Service Account Management": (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      "Centralized Overview": (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 10H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 6H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 14H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18 18H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      "Cross-Platform Visibility": (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 7L20 12L15 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 22H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 17V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      "Compliance Tracking": (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    };

    // For any other titles, use a default icon
    return iconsByTitle[title] || (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 16V8.00002C20.9996 7.6493 20.9071 7.30483 20.7315 7.00119C20.556 6.69754 20.3037 6.44539 20 6.27002L13 2.27002C12.696 2.09449 12.3511 2.00208 12 2.00208C11.6489 2.00208 11.304 2.09449 11 2.27002L4 6.27002C3.69626 6.44539 3.44398 6.69754 3.26846 7.00119C3.09294 7.30483 3.00036 7.6493 3 8.00002V16C3.00036 16.3508 3.09294 16.6952 3.26846 16.9989C3.44398 17.3025 3.69626 17.5547 4 17.73L11 21.73C11.304 21.9056 11.6489 21.998 12 21.998C12.3511 21.998 12.696 21.9056 13 21.73L20 17.73C20.3037 17.5547 20.556 17.3025 20.7315 16.9989C20.9071 16.6952 20.9996 16.3508 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3.27002 6.96002L12 12.01L20.73 6.96002" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };
  
  // Calculate a gradient based on index for subtle color variation
  const gradientColors = [
    [theme.palette.primary.main, '#f0f8ff'],
    [theme.palette.secondary.main, '#fffff0'],
    [theme.palette.success.main, '#f0fff0'],
    [theme.palette.info.main, '#f0f8ff'],
    [theme.palette.warning.main, '#fff8f0']
  ];
  
  const colorIndex = index % gradientColors.length;
  const [accentColor, bgHoverColor] = gradientColors[colorIndex];
  
  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'divider',
        width: { xs: '100%', sm: 'calc(50% - 24px)', lg: 'calc(33.33% - 24px)' },
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          transform: 'translateY(-4px)',
          borderColor: alpha(accentColor, 0.5),
          bgcolor: alpha(bgHoverColor, 0.2),
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          backgroundColor: accentColor,
          borderTopLeftRadius: '8px',
          borderBottomLeftRadius: '8px',
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1.5, 
        mb: 2,
        color: accentColor
      }}>
        {getIcon()}
        <Typography variant="subtitle1" fontWeight="bold">
          {title}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
        {description}
      </Typography>
    </Paper>
  );
}

// InsightItem component for styled insights
const InsightItem = ({ 
  icon, 
  title, 
  description, 
  color 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  color: string;
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'flex-start', 
      gap: 1.5,
      mb: 2,
    }}>
      <Box sx={{ 
        color: color,
        mt: 0.5
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: color, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
    </Box>
  );
};

// RefreshButton component
const RefreshButton = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshStore, setData } = useServiceAccountStore();
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'warning' | 'error' }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Import generateSampleData function from DataSourceSelector
  const generateSampleData = (): any[] => {
    const platforms = ['DATABASE', 'ACTIVE_DIRECTORY', 'AWS', 'Azure', 'GCP', 'On-Premise'];
    const environments = ['Production', 'Development', 'Test', 'Staging', 'Pre-Production'];
    const requestTypeOptions = ['New', 'Modify', 'Delete', 'Extend', 'Review'];
    const primaryUses = ['Application', 'Database', 'API', 'Monitoring', 'Automation', 'Integration'];
    const passwordExpiryIntervals = ['30 days', '60 days', '90 days', '180 days', '1 year', 'Never'];
    const formNames = ['SA-Request-Form', 'Cloud-Access-Form', 'Privilege-Request', 'DB-Access-Form'];
    
    // Sample password character sets
    const strongPasswords = [
      'P@ssw0rd1234567890',      // 16+ chars, 3 types
      'Str0ng#P@ssw0rd2023!',    // 16+ chars, 4 types
      'Secur1ty!C0mpl3x2023',    // 16+ chars, 4 types
      'L0ngP@ssw0rdExample',     // 16+ chars, 3 types
      'My$ecureP@ssw0rd123'      // 16+ chars, 4 types
    ];
    
    const weakPasswords = [
      'P@ssword123',             // < 16 chars, 3 types
      'Simple123',               // < 16 chars, 2 types
      'qwerty',                  // < 16 chars, 1 type
      'Adm1n',                   // < 16 chars, 2 types
      'Test!234'                 // < 16 chars, 3 types
    ];
    
    const results: any[] = [];
    const now = new Date();
    
    // Generate data over the last 12 months with more requests in recent months
    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      // Calculate the date for this month (going backward from current month)
      const monthDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const monthName = monthDate.toLocaleString('default', { month: 'short' });
      const yearNum = monthDate.getFullYear();
      
      // More records for recent months, less for older months (50-150 range)
      // Between 50-150 records per month with more in recent months
      const baseCount = 50;
      const trendFactor = Math.max(0, 100 - (monthOffset * 8)); // Gradually decrease for older months
      const recordsInMonth = Math.round(baseCount + trendFactor);
      
      // Generate records for this month with request_type distribution
      for (let i = 0; i < recordsInMonth; i++) {
        const isActive = Math.random() > 0.2;
        const isPrivileged = Math.random() > 0.7;
        const isIsraDocumented = Math.random() > 0.3;
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        const requestType = requestTypeOptions[Math.floor(Math.random() * requestTypeOptions.length)];
        
        // Add password-related fields for anomaly detection
        const isInteractive = Math.random() > 0.4;
        const isMonitored = Math.random() > 0.3;
        const hasAnomaliesDetected = Math.random() > 0.9; // 10% chance of having anomalies
        
        // Generate a date within this month
        const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
        const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
        const dateAdded = new Date(monthDate.getFullYear(), monthDate.getMonth(), randomDay);
        
        // Create a unique ID that includes the month and a sequential number
        const uniqueId = `SA-${yearNum}${String(monthDate.getMonth() + 1).padStart(2, '0')}-${String(i+1).padStart(4, '0')}`;
        const accountName = `svc-${platform.toLowerCase()}-${Math.floor(Math.random() * 1000)}`;
        
        // Generate password rotation dates - deliberately create some violations
        let passwordUpdatedDate: Date;
        
        // Create password rotation violations for some accounts based on account type
        if (!isMonitored && !isInteractive && Math.random() > 0.7) {
          // Some non-monitored, non-interactive accounts with outdated passwords (> 4 years)
          passwordUpdatedDate = new Date(now.getFullYear() - 5, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        } else if (!isMonitored && isInteractive && Math.random() > 0.8) {
          // Some non-monitored but interactive accounts with outdated passwords (> 3 years)
          passwordUpdatedDate = new Date(now.getFullYear() - 4, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        } else if (isMonitored && !isInteractive && Math.random() > 0.9) {
          // A few monitored non-interactive accounts with outdated passwords (> 5 years)
          passwordUpdatedDate = new Date(now.getFullYear() - 6, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        } else if (hasAnomaliesDetected && Math.random() > 0.7) {
          // Some accounts with anomalies detected but not rotated within 15 days
          passwordUpdatedDate = new Date(now.getTime() - (20 + Math.floor(Math.random() * 30)) * 24 * 60 * 60 * 1000);
        } else {
          // Regular accounts with recent password updates
          passwordUpdatedDate = new Date(now.getTime() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000);
        }
        
        // Deliberately create some password construction violations by using weak passwords
        const useWeakPassword = Math.random() > 0.8; // 20% chance of weak password
        const passwordLastSample = useWeakPassword
          ? weakPasswords[Math.floor(Math.random() * weakPasswords.length)]
          : strongPasswords[Math.floor(Math.random() * strongPasswords.length)];
        
        results.push({
          rcd_added: dateAdded.toISOString(),
          sa_active: isActive,
          sa_isprivileged: isPrivileged,
          sa_platform: platform,
          sa_environment: environments[Math.floor(Math.random() * environments.length)],
          sa_requesttype: requestType,
          sa_primary_use: primaryUses[Math.floor(Math.random() * primaryUses.length)],
          sa_id: uniqueId,
          sa_au: uniqueId,
          sa_name: accountName,
          sa_createdon: dateAdded.toISOString(),
          sa_password_expiration_interval: passwordExpiryIntervals[Math.floor(Math.random() * passwordExpiryIntervals.length)],
          sa_business_justification: `Business need for ${platform} access in ${isPrivileged ? 'privileged' : 'standard'} mode`,
          sa_isisradocumented: isIsraDocumented,
          sa_form_name: formNames[Math.floor(Math.random() * formNames.length)],
          sa_completion_date: new Date(dateAdded.getTime() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
          platformdefined_1_label: 'Department',
          platformdefined_1_value: ['Finance', 'IT', 'HR', 'Marketing', 'Sales'][Math.floor(Math.random() * 5)],
          Database_Brand: platform === 'DATABASE' ? ['Oracle', 'SQL Server', 'MySQL', 'PostgreSQL', 'MongoDB'][Math.floor(Math.random() * 5)] : undefined,
          Database_Name: platform === 'DATABASE' ? `DB-${Math.floor(Math.random() * 1000)}` : undefined,
          Server: platform === 'DATABASE' || platform === 'On-Premise' ? `SVR-${Math.floor(Math.random() * 1000)}` : undefined,
          load_date: new Date().toISOString(),
          request_month: monthName,
          request_year: yearNum,
          
          // Additional fields for anomaly detection
          sa_password_updated: passwordUpdatedDate.toISOString(),
          sa_password_last: passwordLastSample,
          sa_isinteractive: isInteractive,
          sa_ismonitored: isMonitored,
          sa_anomalies_detected: hasAnomaliesDetected
        });
      }
    }
    
    return results;
  };
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    setNotification({
      open: true,
      message: 'Refreshing dashboard data...',
      severity: 'info'
    });
    
    // First, clear all existing data
    refreshStore();
    
    // Wait briefly to simulate a refresh
    setTimeout(() => {
      // Generate and load new sample data
      try {
        const sampleData = generateSampleData();
        setData(sampleData);
        setNotification({
          open: true,
          message: `Dashboard refreshed with ${sampleData.length} new records`,
          severity: 'success'
        });
      } catch (err) {
        console.error('Error generating sample data:', err);
        setNotification({
          open: true,
          message: 'Error refreshing dashboard',
          severity: 'error'
        });
      } finally {
        setIsRefreshing(false);
      }
    }, 1500);
  };
  
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  return (
    <>
      <Tooltip title="Refresh dashboard">
        <IconButton 
          onClick={handleRefresh} 
          sx={{ 
            color: 'text.secondary',
            transition: 'transform 0.5s ease',
            animation: isRefreshing ? 'spin 1.5s linear infinite' : 'none',
            '@keyframes spin': {
              '0%': {
                transform: 'rotate(0deg)',
              },
              '100%': {
                transform: 'rotate(360deg)',
              },
            },
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23 4V10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 20V14H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.51 9.00001C4.01717 7.56645 4.87913 6.28665 6.01547 5.27471C7.1518 4.26276 8.52547 3.55274 10.0083 3.2111C11.4911 2.86946 13.0348 2.90692 14.4952 3.32038C15.9556 3.73385 17.2853 4.50581 18.36 5.56001L23 10M1 14L5.64 18.44C6.71475 19.4942 8.04437 20.2662 9.50481 20.6796C10.9652 21.0931 12.5089 21.1306 13.9917 20.7889C15.4745 20.4473 16.8482 19.7373 17.9845 18.7253C19.1209 17.7134 19.9828 16.4336 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </IconButton>
      </Tooltip>
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default DashboardLayout; 