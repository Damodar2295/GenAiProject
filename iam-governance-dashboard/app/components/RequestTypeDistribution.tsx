'use client';

import { Paper, Typography, Box, useTheme, Divider } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useServiceAccountStore } from '../store/useServiceAccountStore';
import { useState, useEffect } from 'react';
import { AlertCircle, Plus, RotateCcw, RefreshCw, PieChart as PieChartIcon } from 'lucide-react';
import { alpha } from '@mui/material/styles';
import React from 'react';

export default function RequestTypeDistribution() {
  const { filteredData, setFilter } = useServiceAccountStore();
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [requestTypeData, setRequestTypeData] = useState<any[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);

  // Define meaningful colors for different request types
  const requestTypeColors = {
    'New': '#4CAF50', // Green for new accounts
    'Renewal': '#2196F3', // Blue for renewals
    'Modification': '#FF9800', // Orange for modifications
    'Deactivation': '#F44336', // Red for deactivations
    'Unknown': '#9E9E9E', // Gray for unknown
    'Administrative': '#9C27B0', // Purple for administrative
    'Emergency': '#E91E63', // Pink for emergency
    'Transfer': '#00BCD4', // Cyan for transfers
  };
  
  // Assign icons to request types
  const requestTypeIcons = {
    'New': <Plus size={16} />,
    'Renewal': <RefreshCw size={16} />,
    'Modification': <RotateCcw size={16} />,
    'Deactivation': <AlertCircle size={16} />,
  };

  // Process data to get request type distribution with better categorization
  useEffect(() => {
    // Generate demo data if actual data is not available
    if (!filteredData || filteredData.length === 0) {
      const demoData = generateDemoData();
      setRequestTypeData(demoData);
      setTotalRequests(demoData.reduce((sum, item) => sum + item.value, 0));
      return;
    }

    // Category mapping to standardize request types
    const categoryMapping: {[key: string]: string} = {
      'New Account': 'New',
      'New': 'New',
      'Create': 'New',
      'Creation': 'New',
      'Setup': 'New',
      'Renew': 'Renewal',
      'Renewal': 'Renewal',
      'Extend': 'Renewal',
      'Extension': 'Renewal',
      'Modify': 'Modification',
      'Modification': 'Modification',
      'Update': 'Modification',
      'Change': 'Modification',
      'Permission Change': 'Modification',
      'Deactivate': 'Deactivation',
      'Deactivation': 'Deactivation',
      'Remove': 'Deactivation',
      'Delete': 'Deactivation',
      'Disable': 'Deactivation',
    };
    
    const typeCounts = filteredData.reduce((acc: Record<string, number>, account: any) => {
      let requestType = account.sa_requesttype || 'Unknown';
      
      // Map to standard categories if possible
      Object.entries(categoryMapping).forEach(([key, value]) => {
        if (requestType.toLowerCase().includes(key.toLowerCase())) {
          requestType = value;
        }
      });
      
      acc[requestType] = (acc[requestType] || 0) + 1;
      return acc;
    }, {});

    const processedData = Object.entries(typeCounts)
      .map(([name, value]) => ({
        name,
        value,
        color: requestTypeColors[name as keyof typeof requestTypeColors] || theme.palette.primary.main,
        percentage: Math.round((value as number / filteredData.length) * 100),
        icon: requestTypeIcons[name as keyof typeof requestTypeIcons] || null,
        fill: requestTypeColors[name as keyof typeof requestTypeColors] || theme.palette.primary.main,
      }))
      .sort((a, b) => b.value - a.value);
      
    setRequestTypeData(processedData);
    
    // Calculate total requests
    const total = processedData.reduce((sum, item) => sum + item.value, 0);
    setTotalRequests(total);
  }, [filteredData, theme.palette.primary.main]);
  
  // Function to generate demo data for the chart
  const generateDemoData = () => {
    const types = ['New', 'Renewal', 'Modification', 'Deactivation'];
    const total = 100;
    
    // Create balanced distribution with some variation
    const demoDistribution = [
      { name: 'New', percent: 35 + Math.floor(Math.random() * 10) },
      { name: 'Renewal', percent: 30 + Math.floor(Math.random() * 8) },
      { name: 'Modification', percent: 20 + Math.floor(Math.random() * 5) },
      { name: 'Deactivation', percent: 10 + Math.floor(Math.random() * 3) },
    ];
    
    // Adjust to make sure they add up to 100%
    const totalPercent = demoDistribution.reduce((sum, item) => sum + item.percent, 0);
    const adjustmentFactor = 100 / totalPercent;
    
    demoDistribution.forEach(item => {
      item.percent = Math.round(item.percent * adjustmentFactor);
    });
    
    // Final adjustment to ensure exactly 100%
    const finalTotal = demoDistribution.reduce((sum, item) => sum + item.percent, 0);
    if (finalTotal !== 100) {
      demoDistribution[0].percent += (100 - finalTotal);
    }
    
    return demoDistribution.map(item => ({
      name: item.name,
      value: Math.round((item.percent / 100) * total),
      color: requestTypeColors[item.name as keyof typeof requestTypeColors],
      fill: requestTypeColors[item.name as keyof typeof requestTypeColors],
      percentage: item.percent,
      icon: requestTypeIcons[item.name as keyof typeof requestTypeIcons],
    }));
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            padding: '10px',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <Typography variant="body2" fontWeight="bold" sx={{ color: payload[0].payload.color }}>
            {payload[0].name} Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Count: <strong>{payload[0].value}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Percentage: <strong>{payload[0].payload.percentage}%</strong>
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // Handle click for filtering by request type
  const handleChartClick = (data: any) => {
    if (data && data.name) {
      setFilter({ requestType: data.name });
    }
  };

  // Custom legend renderer
  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: 1,
        mt: 2,
      }}>
        {payload.map((entry: any, index: number) => {
          const item = requestTypeData.find(d => d.name === entry.value);
          if (!item) return null;
          
          return (
            <Box 
              key={`legend-${index}`}
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1.5,
                py: 0.75,
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: activeIndex === index ? alpha(item.color, 0.1) : 'transparent',
                border: activeIndex === index ? `1px solid ${alpha(item.color, 0.2)}` : '1px solid transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha(item.color, 0.1)
                }
              }}
              onClick={() => handleChartClick(item)}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box 
                  sx={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: '3px', 
                    backgroundColor: item.color,
                    flexShrink: 0
                  }} 
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {item.icon && (
                    <Box color={item.color} sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      {item.icon}
                    </Box>
                  )}
                  <Typography 
                    variant="body2" 
                    fontWeight={activeIndex === index ? 'medium' : 'normal'}
                    fontSize={{ xs: 11, sm: 12 }}
                  >
                    {item.name}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 1 }}>
                <Typography variant="caption" color="text.secondary" fontSize={{ xs: 10, sm: 11 }}>
                  {item.value}
                </Typography>
                <Typography 
                  variant="caption" 
                  fontWeight="bold" 
                  sx={{ 
                    color: item.color,
                    bgcolor: alpha(item.color, 0.1),
                    px: 0.75,
                    py: 0.25,
                    borderRadius: '4px',
                    fontSize: { xs: 10, sm: 11 }
                  }}
                >
                  {item.percentage}%
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Paper 
      elevation={2}
      sx={{ 
        p: { xs: 2, md: 2.5 }, 
        height: '100%', 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        background: theme => alpha(theme.palette.background.paper, 0.95),
        backdropFilter: 'blur(8px)',
        boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
        border: theme => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <PieChartIcon size={19} color="#4CAF50" strokeWidth={2.5} />
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#4CAF50', fontSize: { xs: '1rem', sm: '1.125rem' } }}>
              Request Type Distribution
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, mt: 0.25 }}>
            Service accounts by request category
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: alpha('#4CAF50', 0.1),
          px: 1.25,
          py: 0.5, 
          borderRadius: '8px'
        }}>
          <Typography variant="body2" fontWeight="medium" color="#4CAF50" sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}>
            {totalRequests} Total
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        minHeight: { xs: '280px', sm: '320px' }
      }}>
        <Box sx={{ 
          width: { xs: '100%', md: '50%' }, 
          height: { xs: '220px', sm: '280px' }
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={requestTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                onClick={handleChartClick}
                activeIndex={activeIndex}
              >
                {requestTypeData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={theme.palette.background.paper}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <text 
                x="50%" 
                y="50%" 
                textAnchor="middle" 
                dominantBaseline="middle"
                fill="#4CAF50"
                fontWeight="bold"
                fontSize="22"
              >
                {totalRequests}
              </text>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        
        <Box sx={{ 
          width: { xs: '100%', md: '50%' },
          pl: { xs: 0, md: 3 },
          mt: { xs: 2, md: 0 },
          height: '100%',
          overflowY: 'auto'
        }}>
          {renderLegend({ payload: requestTypeData.map(item => ({ value: item.name, color: item.color })) })}
        </Box>
      </Box>
    </Paper>
  );
}