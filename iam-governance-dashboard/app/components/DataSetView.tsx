'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Divider, 
  TextField, 
  InputAdornment,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Chip,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Collapse,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  useTheme,
  Grid
} from '@mui/material';
import { 
  Search, 
  Sliders, 
  FileSpreadsheet, 
  Database, 
  ChevronUp, 
  ChevronDown, 
  RefreshCw, 
  Check, 
  X, 
  CloudOff, 
  Cloud, 
  Filter, 
  Download,
  Star
} from 'lucide-react';
import { useServiceAccountStore } from '../store/useServiceAccountStore';
import { ServiceAccount } from '../types';
import { ClientOnly } from '../components/ClientOnly';
import React from 'react';
import { styled, alpha } from '@mui/material/styles';
import { InputBase } from '@mui/material';

// Add a helper to format dates
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return dateString;
  }
};

// Update tab styling
const StyledTab = styled(Tab)(({ theme }) => ({
  fontWeight: 500,
  fontSize: '0.9rem',
  color: theme.palette.text.secondary,
  textTransform: 'none',
  minHeight: 48,
  padding: '0 16px',
  '&.Mui-selected': {
    color: theme.palette.primary.main,
    fontWeight: 600,
  },
  transition: 'all 0.2s',
}));

// Update search field styling
const SearchInput = styled(InputBase)(({ theme }) => ({
  flex: 1,
  padding: '8px 12px',
  fontSize: '0.9rem',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.background.paper, 0.6)
    : alpha(theme.palette.common.white, 0.9),
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.paper, 0.8)
      : alpha(theme.palette.common.white, 1),
    boxShadow: theme.palette.mode === 'dark'
      ? 'none'
      : '0 1px 3px rgba(0,0,0,0.05)',
  },
  '&:focus-within': {
    border: `1px solid ${theme.palette.primary.main}`,
    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
  },
}));

export default function DataSetView() {
  const theme = useTheme();
  const { data } = useServiceAccountStore();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{column: string, direction: 'asc' | 'desc'}>({
    column: 'sa_id',
    direction: 'asc'
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedRow, setSelectedRow] = useState<ServiceAccount | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [privilegedFilter, setPrivilegedFilter] = useState<string>('all');
  
  // Create a list of unique platforms for the filter
  const platforms = useMemo(() => {
    if (!data) return [];
    const platformSet = new Set<string>();
    data.forEach(account => {
      if (account.sa_platform) {
        platformSet.add(account.sa_platform);
      }
    });
    return ['all', ...Array.from(platformSet)];
  }, [data]);
  
  // Filtered and sorted data
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Apply filters
    let filtered = data.filter(account => {
      // Search term filter (across multiple fields)
      const searchFields = [
        account.sa_id,
        account.sa_platform,
        account.sa_environment,
        account.sa_requesttype,
        account.sa_primary_use,
        account.sa_business_justification,
      ];
      
      const matchesSearch = searchTerm === '' || 
        searchFields.some(field => 
          field && field.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      // Platform filter
      const matchesPlatform = platformFilter === 'all' || 
        account.sa_platform === platformFilter;
      
      // Active filter
      const matchesActive = 
        activeFilter === 'all' || 
        (activeFilter === 'active' && account.sa_active) || 
        (activeFilter === 'inactive' && !account.sa_active);
      
      // Privileged filter
      const matchesPrivileged = 
        privilegedFilter === 'all' || 
        (privilegedFilter === 'privileged' && account.sa_isprivileged) || 
        (privilegedFilter === 'non-privileged' && !account.sa_isprivileged);
      
      return matchesSearch && matchesPlatform && matchesActive && matchesPrivileged;
    });
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.column];
      const bValue = b[sortConfig.column];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return filtered;
  }, [data, searchTerm, sortConfig, platformFilter, activeFilter, privilegedFilter]);
  
  // Reset to first page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchTerm, platformFilter, activeFilter, privilegedFilter]);
  
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleSort = (column: string) => {
    setSortConfig({
      column,
      direction: sortConfig.column === column && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };
  
  const handleRowClick = (row: ServiceAccount) => {
    setSelectedRow(selectedRow?.sa_id === row.sa_id ? null : row);
  };
  
  // Calculate pagination
  const paginatedData = useMemo(() => {
    return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);
  
  if (!data || data.length === 0) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: '12px',
          height: 400,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 2,
          bgcolor: theme.palette.mode === 'dark' ? '#2C2C2E' : alpha(theme.palette.background.paper, 0.6),
          transition: 'all 0.3s ease-in-out',
          animation: 'fadeIn 0.5s ease-in-out',
          '@keyframes fadeIn': {
            '0%': {
              opacity: 0,
              transform: 'translateY(10px)'
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)'
            }
          }
        }}
      >
        <Box 
          sx={{ 
            width: 70,
            height: 70,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            mb: 1
          }}
        >
          <Database size={32} color={theme.palette.primary.main} />
        </Box>
        <Typography variant="h6" color="primary.main" fontWeight="medium">
          No data available
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 400 }}>
          Upload an Excel file or generate sample data using the options above.
        </Typography>
      </Paper>
    );
  }
  
  // Statistics for the data summary
  const stats = useMemo(() => {
    if (!data) return { total: 0, active: 0, inactive: 0, privileged: 0, platforms: {} };
    
    const platforms: Record<string, number> = {};
    let active = 0;
    let privileged = 0;
    
    data.forEach(account => {
      if (account.sa_active) active++;
      if (account.sa_isprivileged) privileged++;
      
      const platform = account.sa_platform || 'Unknown';
      platforms[platform] = (platforms[platform] || 0) + 1;
    });
    
    return {
      total: data.length,
      active,
      inactive: data.length - active,
      privileged,
      platforms
    };
  }, [data]);
  
  return (
    <ClientOnly>
      <Paper
        elevation={2}
        sx={{
          borderRadius: '12px',
          backgroundColor: theme.palette.mode === 'dark' ? '#2C2C2E' : '#FFFFFF',
          transition: 'box-shadow 0.3s ease-in-out',
          overflow: 'hidden',
          position: 'relative',
          '&:hover': {
            boxShadow: theme.shadows[8],
          },
          animation: 'fadeIn 0.5s ease-in-out',
          '@keyframes fadeIn': {
            '0%': {
              opacity: 0,
              transform: 'translateY(10px)'
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)'
            }
          }
        }}
      >
        {/* Blue accent bar at the top to indicate connection with data source */}
        <Box 
          sx={{ 
            height: '4px',
            width: '100%',
            bgcolor: theme.palette.primary.main,
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
          }}
        />
        
        {/* Header section */}
        <Box 
          sx={{ 
            p: 2,
            mt: '4px', // Add margin to account for the accent bar
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FileSpreadsheet size={24} color={theme.palette.primary.main} />
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                Data Explorer
              </Typography>
              <Chip 
                label={`${stats.total} records`} 
                size="small"
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  fontWeight: 'bold',
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <ClientOnly>
                <Tooltip title={viewMode === 'table' ? 'Card View' : 'Table View'}>
                  <IconButton
                    size="small"
                    onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
                    sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                      }
                    }}
                  >
                    {viewMode === 'table' ? 
                      <Database size={18} color={theme.palette.primary.main} /> : 
                      <FileSpreadsheet size={18} color={theme.palette.primary.main} />
                    }
                  </IconButton>
                </Tooltip>
              </ClientOnly>
              
              <ClientOnly>
                <Tooltip title="Export Data">
                  <IconButton
                    size="small"
                    sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                      }
                    }}
                  >
                    <Download size={18} color={theme.palette.primary.main} />
                  </IconButton>
                </Tooltip>
              </ClientOnly>
            </Box>
          </Box>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search field */}
            <TextField
              placeholder="Search accounts..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 1 }
              }}
              sx={{ flexGrow: 1, minWidth: 200 }}
            />
            
            {/* Platform filter */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Platform</InputLabel>
              <Select
                value={platformFilter}
                label="Platform"
                onChange={(e) => setPlatformFilter(e.target.value)}
              >
                <MenuItem value="all">All Platforms</MenuItem>
                {platforms.filter(p => p !== 'all').map(platform => (
                  <MenuItem key={platform} value={platform}>{platform}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Active filter */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={activeFilter}
                label="Status"
                onChange={(e) => setActiveFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            
            {/* Privileged filter */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Privilege</InputLabel>
              <Select
                value={privilegedFilter}
                label="Privilege"
                onChange={(e) => setPrivilegedFilter(e.target.value)}
              >
                <MenuItem value="all">All Privileges</MenuItem>
                <MenuItem value="privileged">Privileged</MenuItem>
                <MenuItem value="non-privileged">Non-Privileged</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<Filter size={16} />}
              onClick={() => setFiltersOpen(!filtersOpen)}
              sx={{ ml: 'auto' }}
            >
              {filtersOpen ? 'Hide Filters' : 'More Filters'}
            </Button>
          </Box>
          
          {/* Advanced filters section */}
          <Collapse in={filtersOpen}>
            <Box sx={{ mt: 2, pt: 2, borderTop: `1px dashed ${theme.palette.divider}` }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Advanced Filters
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', mr: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Data Summary
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      size="small" 
                      label={`Active: ${stats.active}`} 
                      icon={<Check size={14} />}
                      sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }}
                    />
                    <Chip 
                      size="small" 
                      label={`Inactive: ${stats.inactive}`} 
                      icon={<X size={14} />}
                      sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main }}
                    />
                    <Chip 
                      size="small"
                      label={`Privileged: ${stats.privileged}`}
                      icon={<Star size={14} />}
                      sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Collapse>
        </Box>
        
        {/* Main data view section */}
        <Box>
          {/* Table view */}
          {viewMode === 'table' && (
            <>
              <TableContainer sx={{ maxHeight: 500 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell 
                        onClick={() => handleSort('sa_id')}
                        sx={{ 
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          bgcolor: 'transparent',
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                          color: sortConfig.column === 'sa_id' ? theme.palette.primary.main : 'inherit',
                        }}
                      >
                        <ClientOnly>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            ID
                            {sortConfig.column === 'sa_id' && (
                              sortConfig.direction === 'asc' ? 
                                <ChevronUp size={16} /> : 
                                <ChevronDown size={16} />
                            )}
                          </Box>
                        </ClientOnly>
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSort('sa_platform')}
                        sx={{ 
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          bgcolor: 'transparent',
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                          color: sortConfig.column === 'sa_platform' ? theme.palette.primary.main : 'inherit',
                        }}
                      >
                        <ClientOnly>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Platform
                            {sortConfig.column === 'sa_platform' && (
                              sortConfig.direction === 'asc' ? 
                                <ChevronUp size={16} /> : 
                                <ChevronDown size={16} />
                            )}
                          </Box>
                        </ClientOnly>
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSort('sa_environment')}
                        sx={{ 
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          bgcolor: 'transparent',
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                          color: sortConfig.column === 'sa_environment' ? theme.palette.primary.main : 'inherit',
                        }}
                      >
                        <ClientOnly>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Environment
                            {sortConfig.column === 'sa_environment' && (
                              sortConfig.direction === 'asc' ? 
                                <ChevronUp size={16} /> : 
                                <ChevronDown size={16} />
                            )}
                          </Box>
                        </ClientOnly>
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSort('sa_active')}
                        sx={{ 
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          bgcolor: 'transparent',
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                          color: sortConfig.column === 'sa_active' ? theme.palette.primary.main : 'inherit',
                        }}
                      >
                        <ClientOnly>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Status
                            {sortConfig.column === 'sa_active' && (
                              sortConfig.direction === 'asc' ? 
                                <ChevronUp size={16} /> : 
                                <ChevronDown size={16} />
                            )}
                          </Box>
                        </ClientOnly>
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSort('sa_isprivileged')}
                        sx={{ 
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          bgcolor: 'transparent',
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                          color: sortConfig.column === 'sa_isprivileged' ? theme.palette.primary.main : 'inherit',
                        }}
                      >
                        <ClientOnly>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Privileged
                            {sortConfig.column === 'sa_isprivileged' && (
                              sortConfig.direction === 'asc' ? 
                                <ChevronUp size={16} /> : 
                                <ChevronDown size={16} />
                            )}
                          </Box>
                        </ClientOnly>
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSort('sa_requesttype')}
                        sx={{ 
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          bgcolor: 'transparent',
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                          color: sortConfig.column === 'sa_requesttype' ? theme.palette.primary.main : 'inherit',
                        }}
                      >
                        <ClientOnly>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Request Type
                            {sortConfig.column === 'sa_requesttype' && (
                              sortConfig.direction === 'asc' ? 
                                <ChevronUp size={16} /> : 
                                <ChevronDown size={16} />
                            )}
                          </Box>
                        </ClientOnly>
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSort('sa_createdon')}
                        sx={{ 
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          bgcolor: 'transparent',
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                          color: sortConfig.column === 'sa_createdon' ? theme.palette.primary.main : 'inherit',
                        }}
                      >
                        <ClientOnly>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Created
                            {sortConfig.column === 'sa_createdon' && (
                              sortConfig.direction === 'asc' ? 
                                <ChevronUp size={16} /> : 
                                <ChevronDown size={16} />
                            )}
                          </Box>
                        </ClientOnly>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedData.map((row) => (
                      <React.Fragment key={row.sa_id}>
                        <TableRow 
                          hover
                          onClick={() => handleRowClick(row)}
                          sx={{ 
                            cursor: 'pointer',
                            bgcolor: selectedRow?.sa_id === row.sa_id ? 
                              alpha(theme.palette.primary.main, 0.05) : 'inherit',
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.03),
                            }
                          }}
                        >
                          <TableCell sx={{ fontWeight: 'medium' }}>{row.sa_id}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {row.sa_platform.includes('AWS') || row.sa_platform.includes('Azure') || row.sa_platform.includes('GCP') ? (
                                <Cloud size={16} color={theme.palette.primary.main} />
                              ) : (
                                <Database size={16} color={theme.palette.secondary.main} />
                              )}
                              {row.sa_platform}
                            </Box>
                          </TableCell>
                          <TableCell>{row.sa_environment}</TableCell>
                          <TableCell>
                            <Chip 
                              label={row.sa_active ? 'Active' : 'Inactive'} 
                              size="small"
                              sx={{ 
                                bgcolor: row.sa_active ? 
                                  alpha(theme.palette.success.main, 0.1) : 
                                  alpha(theme.palette.error.main, 0.1),
                                color: row.sa_active ? 
                                  theme.palette.success.main : 
                                  theme.palette.error.main,
                                fontWeight: 'medium'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={row.sa_isprivileged ? 'Yes' : 'No'} 
                              size="small"
                              sx={{ 
                                bgcolor: row.sa_isprivileged ? 
                                  alpha(theme.palette.warning.main, 0.1) : 
                                  alpha(theme.palette.info.main, 0.1),
                                color: row.sa_isprivileged ? 
                                  theme.palette.warning.main : 
                                  theme.palette.info.main,
                                fontWeight: 'medium'
                              }}
                            />
                          </TableCell>
                          <TableCell>{row.sa_requesttype}</TableCell>
                          <TableCell>{formatDate(row.sa_createdon)}</TableCell>
                        </TableRow>
                        {selectedRow?.sa_id === row.sa_id && (
                          <TableRow key={`${row.sa_id}-details`}>
                            <TableCell colSpan={7} sx={{ p: 0, borderBottom: 'none' }}>
                              <Collapse in={selectedRow?.sa_id === row.sa_id}>
                                <Box sx={{ 
                                  p: 2, 
                                  bgcolor: alpha(theme.palette.background.default, 0.5),
                                  borderBottom: `1px solid ${theme.palette.divider}`
                                }}>
                                  <Typography variant="subtitle2" gutterBottom color="primary">
                                    Account Details
                                  </Typography>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <DetailItem label="ID" value={row.sa_id} />
                                        <DetailItem label="Platform" value={row.sa_platform} />
                                        <DetailItem label="Environment" value={row.sa_environment} />
                                        <DetailItem label="Request Type" value={row.sa_requesttype} />
                                        <DetailItem label="Primary Use" value={row.sa_primary_use} />
                                      </Box>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <DetailItem label="Active" value={row.sa_active ? 'Yes' : 'No'} />
                                        <DetailItem label="Privileged" value={row.sa_isprivileged ? 'Yes' : 'No'} />
                                        <DetailItem label="Password Expiry" value={row.sa_password_expiration_interval} />
                                        <DetailItem label="ISRA Documented" value={row.sa_isisradocumented ? 'Yes' : 'No'} />
                                        <DetailItem label="Created On" value={formatDate(row.sa_createdon)} />
                                      </Box>
                                    </Grid>
                                  </Grid>
                                  
                                  {row.sa_business_justification && (
                                    <Box sx={{ mt: 2 }}>
                                      <Typography variant="subtitle2" color="text.secondary">
                                        Business Justification
                                      </Typography>
                                      <Typography variant="body2">
                                        {row.sa_business_justification}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={filteredData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
          
          {/* Card view */}
          {viewMode === 'cards' && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                {paginatedData.map((row) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={row.sa_id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[6]
                        },
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '4px',
                          height: '100%',
                          backgroundColor: row.sa_active ? 
                            theme.palette.success.main : 
                            theme.palette.error.main,
                        }
                      }}
                      onClick={() => handleRowClick(row)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold" noWrap>
                            {row.sa_id}
                          </Typography>
                          
                          <Chip 
                            label={row.sa_isprivileged ? 'Privileged' : 'Standard'} 
                            size="small"
                            sx={{ 
                              bgcolor: row.sa_isprivileged ? 
                                alpha(theme.palette.warning.main, 0.1) : 
                                alpha(theme.palette.info.main, 0.1),
                              color: row.sa_isprivileged ? 
                                theme.palette.warning.main : 
                                theme.palette.info.main,
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {row.sa_platform.includes('AWS') || row.sa_platform.includes('Azure') || row.sa_platform.includes('GCP') ? (
                            <Cloud size={16} color={theme.palette.primary.main} />
                          ) : (
                            <Database size={16} color={theme.palette.secondary.main} />
                          )}
                          <Typography variant="body2" fontWeight="medium" color="text.secondary">
                            {row.sa_platform}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mt: 2 }}>
                          <DetailItem label="Environment" value={row.sa_environment} />
                          <DetailItem label="Request Type" value={row.sa_requesttype} />
                          <DetailItem label="Primary Use" value={row.sa_primary_use} />
                          <DetailItem label="Created" value={formatDate(row.sa_createdon)} />
                        </Box>
                        
                        <Collapse in={selectedRow?.sa_id === row.sa_id}>
                          <Box sx={{ mt: 2, pt: 2, borderTop: `1px dashed ${theme.palette.divider}` }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              Additional Details
                            </Typography>
                            
                            <DetailItem label="Password Expiry" value={row.sa_password_expiration_interval} />
                            <DetailItem label="ISRA Documented" value={row.sa_isisradocumented ? 'Yes' : 'No'} />
                            
                            {row.sa_business_justification && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Business Justification
                                </Typography>
                                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                  {row.sa_business_justification}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <TablePagination
                  rowsPerPageOptions={[12, 24, 48, 96]}
                  component="div"
                  count={filteredData.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    </ClientOnly>
  );
}

// Helper component for displaying detail items
const DetailItem = ({ label, value }: { label: string, value: string | number | boolean | undefined }) => {
  if (value === undefined) return null;
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', mb: 0.5 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight="medium">
        {value.toString()}
      </Typography>
    </Box>
  );
};

// TypeScript interface for the grid data structure
interface Grid {
  xs: number;
  md: number;
} 