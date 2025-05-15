'use client';

import { useState, useEffect } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Box, Typography, CircularProgress, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useServiceAccountStore } from '../store/useServiceAccountStore';

export default function EnvironmentSplit() {
  const theme = useTheme();
  const { data, filter, setFilter } = useServiceAccountStore();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartData, setChartData] = useState<Array<any>>([]);

  // Generate environment data for the chart
  useEffect(() => {
    if (!data || data.length === 0) return;

    // Aggregate data by environment
    const environments = data.reduce((acc: Record<string, number>, account) => {
      // Use actual environment if available, otherwise categorize as per the logic below
      const env = account.sa_environment || mapEnvironment(account);
      acc[env] = (acc[env] || 0) + 1;
      return acc;
    }, {});

    // Convert to array format required by Recharts
    const chartData = Object.entries(environments).map(([name, value], index) => ({
      name,
      value,
      color: getEnvironmentColor(name, index)
    }));

    setChartData(chartData);
  }, [data]);

  // Map an account to an environment if not specified
  const mapEnvironment = (account: any): string => {
    // This is a placeholder logic - ideally would be based on actual naming conventions
    const name = account.sa_name.toLowerCase();
    
    if (name.includes('prod') || name.includes('prd')) {
      return 'Production';
    } else if (name.includes('stg') || name.includes('staging') || name.includes('preprod')) {
      return 'Pre-Production';
    } else if (name.includes('test')) {
      return 'Test';
    } else if (name.includes('dev')) {
      return 'Development';
    }
    
    return 'Other';
  };

  // Get a color for each environment
  const getEnvironmentColor = (environment: string, index: number): string => {
    const colors = {
      'Production': theme.palette.error.main,
      'Pre-Production': theme.palette.warning.main,
      'Test': theme.palette.info.main,
      'Development': theme.palette.success.main,
      'Other': theme.palette.grey[500]
    };
    
    return colors[environment as keyof typeof colors] || 
      [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.error.main,
        theme.palette.warning.main,
        theme.palette.info.main
      ][index % 5];
  };

  const handlePieClick = (data: any, index: number) => {
    if (activeIndex === index) {
      setActiveIndex(null);
      setFilter({});
    } else {
      setActiveIndex(index);
      setFilter({ environment: data.name });
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            backgroundColor: alpha('#fff', 0.9),
            p: 1.5,
            border: `1px solid ${data.color}`,
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          }}
        >
          <Typography variant="subtitle2" sx={{ color: data.color, fontWeight: 'bold' }}>
            {data.name}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Count: <strong>{data.value}</strong>
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {Math.round((data.value / data.total) * 100)}% of total
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // Loading state
  if (!data || data.length === 0 || chartData.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  // Add total to each data point for percentage calculation in tooltip
  const totalAccounts = data.length;
  const enhancedChartData = chartData.map(item => ({
    ...item,
    total: totalAccounts
  }));

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={enhancedChartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            onClick={handlePieClick}
          >
            {enhancedChartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke={theme.palette.background.paper}
                strokeWidth={activeIndex === index ? 2 : 1}
                style={{
                  filter: activeIndex === index 
                    ? 'drop-shadow(0 0 6px rgba(0, 0, 0, 0.3))' 
                    : 'none',
                  opacity: activeIndex === null || activeIndex === index ? 1 : 0.6,
                  cursor: 'pointer',
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="middle" 
            align="right" 
            layout="vertical"
            formatter={(value, entry, index) => {
              const { payload } = entry as any;
              return (
                <Box
                  component="span"
                  sx={{ 
                    color: activeIndex === index 
                      ? payload.color 
                      : activeIndex === null 
                        ? 'text.primary' 
                        : 'text.secondary',
                    fontWeight: activeIndex === index ? 'bold' : 'normal',
                    cursor: 'pointer',
                  }}
                  onClick={() => handlePieClick(payload, index)}
                >
                  {value} ({payload.value})
                </Box>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center text */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <Typography variant="subtitle2" color="text.secondary">
          ENVIRONMENTS
        </Typography>
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          {totalAccounts}
        </Typography>
      </Box>
    </Box>
  );
} 