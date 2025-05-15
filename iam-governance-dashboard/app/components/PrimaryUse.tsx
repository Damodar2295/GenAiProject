'use client';

import { Typography, Box, useTheme } from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { useServiceAccountStore } from '../store/useServiceAccountStore';
import { useState, useEffect } from 'react';
import { alpha } from '@mui/material/styles';

export default function PrimaryUse() {
  const { filteredData } = useServiceAccountStore();
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [primaryUseData, setPrimaryUseData] = useState<any[]>([]);

  // Define colors for different use categories
  const categoryColors = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    '#9c27b0', // purple
    '#00bcd4', // cyan
    '#ff9800'  // orange
  ];

  // Function to generate demo data if no real data is available
  const generateDemoData = () => {
    const useCases = [
      { name: 'Database Access', count: 35 + Math.floor(Math.random() * 15) },
      { name: 'API Access', count: 25 + Math.floor(Math.random() * 12) },
      { name: 'Monitoring', count: 18 + Math.floor(Math.random() * 10) },
      { name: 'Authentication', count: 12 + Math.floor(Math.random() * 8) },
      { name: 'Automation', count: 14 + Math.floor(Math.random() * 6) },
      { name: 'Development', count: 10 + Math.floor(Math.random() * 5) },
      { name: 'Server Access', count: 8 + Math.floor(Math.random() * 4) },
      { name: 'Application', count: 6 + Math.floor(Math.random() * 3) },
    ];

    // Create formatted data
    return useCases.map((item, index) => ({
      name: item.name,
      value: item.count,
      color: categoryColors[index % categoryColors.length]
    }));
  };

  // Process data to get primary use distribution
  useEffect(() => {
    if (!filteredData || filteredData.length === 0) {
      // Use demo data if no filteredData is available
      setPrimaryUseData(generateDemoData());
      return;
    }

    const useCounts = filteredData.reduce((acc: Record<string, number>, account) => {
      let use = account.sa_primary_use || 'Not Specified';
      
      // Normalize common values for better categorization
      if (use.toLowerCase().includes('database') || use.toLowerCase().includes('db')) {
        use = 'Database Access';
      } else if (use.toLowerCase().includes('api') || use.toLowerCase().includes('service')) {
        use = 'API Access';
      } else if (use.toLowerCase().includes('monitor') || use.toLowerCase().includes('log')) {
        use = 'Monitoring';
      } else if (use.toLowerCase().includes('auth') || use.toLowerCase().includes('login')) {
        use = 'Authentication';
      } else if (use.toLowerCase().includes('auto') || use.toLowerCase().includes('script')) {
        use = 'Automation';
      } else if (use.toLowerCase().includes('dev') || use.toLowerCase().includes('test')) {
        use = 'Development';
      } else if (use.toLowerCase().includes('server') || use.toLowerCase().includes('host')) {
        use = 'Server Access';
      } else if (use.toLowerCase().includes('app') || use.toLowerCase().includes('web')) {
        use = 'Application';
      }
      
      acc[use] = (acc[use] || 0) + 1;
      return acc;
    }, {});

    const processedData = Object.entries(useCounts)
      .map(([name, value], index) => ({
        name,
        value,
        color: categoryColors[index % categoryColors.length],
        percentage: Math.round((value / filteredData.length) * 100)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Show top 8 uses

    setPrimaryUseData(processedData);
  }, [filteredData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            p: 1,
            border: `1px solid ${data.color}`,
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            fontSize: '12px',
          }}
        >
          <Typography variant="body2" fontWeight="bold" sx={{ color: data.color }}>
            {data.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Count: <strong>{data.value}</strong>
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            {data.percentage}% of total
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const handleMouseEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={primaryUseData} 
          layout="vertical"
          margin={{ top: 10, right: 20, left: 100, bottom: 10 }}
          barSize={16}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={alpha(theme.palette.divider, 0.7)} />
          <XAxis 
            type="number" 
            tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
            tickLine={{ stroke: theme.palette.divider }}
            axisLine={{ stroke: theme.palette.divider }}
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={100}
            tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.length > 14 ? `${value.substring(0, 12)}...` : value}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: alpha(theme.palette.action.hover, 0.3) }} />
          <Bar 
            dataKey="value" 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            animationDuration={800}
          >
            {primaryUseData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                fillOpacity={activeIndex === index ? 1 : 0.8}
                rx={2}
                ry={2}
                style={{
                  filter: activeIndex === index ? `drop-shadow(0px 0px 4px ${alpha(entry.color, 0.5)})` : 'none',
                  cursor: 'pointer'
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
} 