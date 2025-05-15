'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  Divider,
  Typography,
  styled,
  Tooltip,
  Collapse,
  Drawer as MuiDrawer,
  Theme
} from '@mui/material';
import { 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  Database,
  Server,
  GitBranch,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  FileText,
  Filter,
  ChevronDown,
  Home,
  ShieldCheck,
  ShieldQuestion,
  Cloud,
  Layers,
  KeyRound,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

const DRAWER_WIDTH = 240;
const COLLAPSED_DRAWER_WIDTH = 72;

const SidebarContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'open'
})<{ open: boolean }>(({ theme, open }) => ({
  position: 'fixed',
  height: '100vh',
  width: open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
  backgroundColor: '#FFFFFF',
  borderRight: `1px solid ${theme.palette.divider}`,
  transition: theme.transitions.create(['width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  zIndex: theme.zIndex.drawer,
  boxShadow: '2px 0 20px rgba(0, 0, 0, 0.05)',
}));

const Logo = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'open'
})<{ open: boolean }>(({ theme, open }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: open ? 'flex-start' : 'center',
  padding: theme.spacing(2),
  height: 64,
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  transition: theme.transitions.create(['all'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
}));

const StyledListItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'open'
})<{ active: boolean; open: boolean }>(({ theme, active, open }) => ({
  borderRadius: open ? theme.spacing(1) : theme.spacing(2),
  margin: theme.spacing(0.5),
  padding: open ? theme.spacing(1, 2) : theme.spacing(1),
  backgroundColor: active ? 'rgba(0, 112, 243, 0.08)' : 'transparent',
  '&:hover': {
    backgroundColor: 'rgba(0, 112, 243, 0.05)',
    transform: 'translateX(4px)',
  },
  justifyContent: open ? 'flex-start' : 'center',
  transition: 'all 0.2s ease-in-out',
  position: 'relative',
  overflow: 'hidden',
  '&:before': active ? {
    content: '""',
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 3,
    height: '70%',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '0 4px 4px 0',
  } : {},
}));

const ToggleButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: -12,
  top: 72,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '50%',
  zIndex: 1,
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  transform: 'scale(0.9)',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, background-color 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    transform: 'scale(1)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
  },
  '&:active': {
    transform: 'scale(0.95)',
  },
}));

interface NavigationItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  filters?: NavigationItem[];
}

interface SidebarProps {
  onToggle?: (open: boolean) => void;
  defaultOpen?: boolean;
}

export function Sidebar({ onToggle, defaultOpen = true }: SidebarProps) {
  const [open, setOpen] = useState(defaultOpen);
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    setOpen(!open);
    if (onToggle) {
      onToggle(!open);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const navigationItems: NavigationItem[] = [
    {
      title: 'Dashboard',
      path: '/',
      icon: <Home size={18} />,
    },
    {
      title: 'Service Accounts',
      path: '/service-accounts',
      icon: <ShieldCheck size={18} />,
    },
    {
      title: 'Privileged Access',
      path: '/privileged',
      icon: <Shield size={18} />,
      filters: [
        { title: 'High Privilege', path: '/privileged/high', icon: <ShieldAlert size={18} /> },
        { title: 'Medium Privilege', path: '/privileged/medium', icon: <ShieldCheck size={18} /> },
        { title: 'Low Privilege', path: '/privileged/low', icon: <ShieldQuestion size={18} /> },
      ],
    },
    {
      title: 'Platforms',
      path: '/platforms',
      icon: <Cloud size={18} />,
      filters: [
        { title: 'AWS', path: '/platforms/aws', icon: <Cloud size={18} /> },
        { title: 'Azure', path: '/platforms/azure', icon: <Cloud size={18} /> },
        { title: 'GCP', path: '/platforms/gcp', icon: <Cloud size={18} /> },
        { title: 'On-Premise', path: '/platforms/on-premise', icon: <Server size={18} /> },
      ]
    },
    {
      title: 'Environments',
      path: '/environments',
      icon: <Layers size={18} />,
      filters: [
        { title: 'Production', path: '/environments/production', icon: <Layers size={18} /> },
        { title: 'Pre-Production', path: '/environments/pre-production', icon: <Layers size={18} /> },
        { title: 'Test', path: '/environments/test', icon: <Layers size={18} /> },
        { title: 'Development', path: '/environments/development', icon: <Layers size={18} /> },
      ]
    },
    {
      title: 'Password Expiry',
      path: '/password-expiry',
      icon: <KeyRound size={18} />,
    },
    {
      title: 'Identified Anomalies',
      path: '/anomalies',
      icon: <AlertCircle size={18} />,
    },
    {
      title: 'Reports',
      path: '/reports',
      icon: <FileText size={18} />,
    },
  ];

  const handleGroupClick = (item: NavigationItem) => {
    if (item.filters) {
      setActiveGroup(activeGroup === item.title ? null : item.title);
    } else {
      setActiveGroup(null);
      router.push(item.path);
    }
  };

  if (!mounted) {
    // Prevent hydration mismatch
    return null;
  }

  return (
    <SidebarContainer open={open}>
      <Logo open={open}>
        {open ? (
          <>
            <Typography 
              variant="h6" 
              sx={{ 
                display: 'block',
                fontWeight: 600,
                fontSize: open ? 20 : 16,
                letterSpacing: '-0.018em',
                color: '#D4001A', // Wells Fargo Red
              }}
            >
              Wells Fargo
            </Typography>
          </>
        ) : (
          <>
            <Typography 
              variant="h6" 
              sx={{ 
                display: 'block',
                fontWeight: 600,
                fontSize: open ? 20 : 16,
                letterSpacing: '-0.018em',
                color: '#D4001A', // Wells Fargo Red
              }}
            >
              WF
            </Typography>
          </>
        )}
      </Logo>

      <ToggleButton 
        onClick={handleToggle} 
        size="small"
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
      >
        {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </ToggleButton>

      <Divider sx={{ mb: 1 }} />

      <Box sx={{ overflowY: 'auto', flexGrow: 1, py: 1 }}>
        <List
          sx={{
            mt: 1,
            px: 1,
          }}
        >
          {navigationItems.map((item) => {
            const isItemActive = isActive(item.path);
            const isExpanded = activeGroup === item.title;
            
            return (
              <Box key={item.title}>
                <StyledListItem 
                  active={isItemActive} 
                  open={open}
                  onClick={() => handleGroupClick(item)}
                  sx={{
                    cursor: 'pointer',
                    color: isItemActive ? 'primary.main' : 'text.primary',
                    fontWeight: isItemActive ? 600 : 400,
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: open ? 32 : 'auto',
                    color: isItemActive ? 'primary.main' : 'inherit',
                    transition: 'color 0.2s ease-in-out',
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  
                  {open && (
                    <ListItemText 
                      primary={item.title} 
                      primaryTypographyProps={{ 
                        noWrap: true, 
                        fontWeight: isItemActive ? 600 : 400,
                        fontSize: '0.9rem',
                      }}
                    />
                  )}
                  
                  {open && item.filters && (
                    <ChevronDown 
                      size={16} 
                      style={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease',
                      }}
                    />
                  )}
                </StyledListItem>
                
                {open && isExpanded && item.filters && (
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.filters.map((filter) => {
                        const isFilterActive = isActive(filter.path);
                        
                        return (
                          <StyledListItem
                            key={filter.title}
                            active={isFilterActive}
                            open={open}
                            sx={{
                              pl: 4,
                              cursor: 'pointer',
                              color: isFilterActive ? 'primary.main' : 'text.secondary',
                              fontWeight: isFilterActive ? 600 : 400,
                              fontSize: '0.85rem',
                              opacity: 0.9,
                              '&:hover': {
                                opacity: 1,
                              }
                            }}
                            onClick={() => router.push(filter.path)}
                          >
                            <ListItemIcon sx={{ 
                              minWidth: 28,
                              color: isFilterActive ? 'primary.main' : 'inherit',
                              '& > svg': {
                                width: 16,
                                height: 16,
                              }
                            }}>
                              {filter.icon}
                            </ListItemIcon>
                            <ListItemText 
                              primary={filter.title}
                              primaryTypographyProps={{ 
                                noWrap: true, 
                                fontWeight: isFilterActive ? 600 : 400,
                                fontSize: '0.85rem',
                              }} 
                            />
                          </StyledListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                )}
              </Box>
            );
          })}
        </List>
      </Box>

      <Box sx={{ 
        p: 2, 
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
        }}>
          <Typography variant="caption" color="text.secondary" noWrap>
            IAM Governance v1.0
          </Typography>
        </Box>
      </Box>
    </SidebarContainer>
  );
}

export default Sidebar; 