'use client';

import { Typography, Box, useTheme } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label } from 'recharts';
import { useServiceAccountStore } from '../store/useServiceAccountStore';
import { useState } from 'react';
import { alpha } from '@mui/material/styles';

export default function PrivilegeStatus() {
  const { filteredData, setFilter } = useServiceAccountStore();
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  // Process data to get privilege status distribution
  const processPrivilegeData = () => {
    const privileged = filteredData.filter(account => account.sa_isprivileged).length;
    const nonPrivileged = filteredData.filter(account => !account.sa_isprivileged).length;

    return [
      { name: 'Non-Privileged', value: nonPrivileged, color: theme.palette.info.main },
      { name: 'Privileged', value: privileged, color: theme.palette.warning.main }
    ];
  };

  const privilegeData = processPrivilegeData();
  
  // Calculate total and percentages
  const total = privilegeData.reduce((sum, entry) => sum + entry.value, 0);
  
  // Handle mouse enter on pie sectors
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  // Handle mouse leave
  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

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
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Percentage: <strong>{Math.round((data.value / total) * 100)}%</strong>
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // Handle click for filtering by privilege status
  const handlePieClick = (data: any) => {
    const isPrivileged = data.name === 'Privileged';
    setFilter({ privilegeStatus: isPrivileged ? 'Privileged' : 'Non-Privileged' });
  };

  // Legend component
  const renderLegend = () => {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: 2,
        mt: -0.5,
        mb: 1,
      }}>
        {privilegeData.map((entry, index) => (
          <Box 
            key={`legend-${index}`} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              cursor: 'pointer',
              opacity: activeIndex === undefined || activeIndex === index ? 1 : 0.5,
            }}
            onClick={() => handlePieClick(entry)}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(undefined)}
          >
            <Box 
              sx={{ 
                width: 10, 
                height: 10, 
                borderRadius: '50%', 
                backgroundColor: entry.color 
              }} 
            />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              {entry.name}: {entry.value} ({Math.round((entry.value / total) * 100)}%)
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {renderLegend()}
      <ResponsiveContainer width="100%" height="85%">
        <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <Pie 
            data={privilegeData} 
            dataKey="value" 
            nameKey="name" 
            cx="50%" 
            cy="50%" 
            innerRadius={40} 
            outerRadius={70} 
            paddingAngle={4}
            onClick={handlePieClick}
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
          >
            {privilegeData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                stroke={theme.palette.background.paper}
                strokeWidth={activeIndex === index ? 2 : 1}
                style={{
                  filter: activeIndex === index 
                    ? 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.3))' 
                    : 'none',
                  cursor: 'pointer',
                }}
              />
            ))}
            <Label 
              content={(props) => {
                const cx = props.viewBox?.cx || 0;
                const cy = props.viewBox?.cy || 0;
                
                return (
                  <g>
                    <text 
                      x={cx} 
                      y={cy - 5} 
                      textAnchor="middle" 
                      fill={theme.palette.text.secondary}
                      fontSize={10}
                    >
                      {activeIndex !== undefined ? privilegeData[activeIndex].name : 'Total'}
                    </text>
                    <text 
                      x={cx} 
                      y={cy + 15} 
                      textAnchor="middle" 
                      fill={activeIndex !== undefined ? privilegeData[activeIndex].color : theme.palette.text.primary}
                      fontSize={18}
                      fontWeight="bold"
                    >
                      {activeIndex !== undefined 
                        ? `${privilegeData[activeIndex].value}` 
                        : total}
                    </text>
                  </g>
                );
              }}
              position="center"
            />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
} 