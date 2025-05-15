'use client';

import { Typography, Box, useTheme } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label } from 'recharts';
import { useServiceAccountStore } from '../store/useServiceAccountStore';
import { useState } from 'react';
import { alpha } from '@mui/material/styles';

export default function ActiveStatusPie() {
  const { filteredData, setFilter } = useServiceAccountStore();
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  // Process data to get active vs inactive status
  const processActiveStatusData = () => {
    const active = filteredData.filter(account => account.sa_active).length;
    const inactive = filteredData.filter(account => !account.sa_active).length;

    return [
      { name: 'Active', value: active, color: theme.palette.success.main },
      { name: 'Inactive', value: inactive, color: theme.palette.error.main }
    ];
  };

  const activeStatusData = processActiveStatusData();

  // Calculate total and percentages
  const total = activeStatusData.reduce((sum, entry) => sum + entry.value, 0);
  const activePercentage = total > 0 ? Math.round((activeStatusData[0].value / total) * 100) : 0;
  const inactivePercentage = total > 0 ? Math.round((activeStatusData[1].value / total) * 100) : 0;

  // Handle click for filtering by active status
  const handlePieClick = (data: any) => {
    setFilter({ activeStatus: data.name as 'Active' | 'Inactive' });
  };

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
        {activeStatusData.map((entry, index) => (
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
            data={activeStatusData} 
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
            {activeStatusData.map((entry, index) => (
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
                return (
                  <g>
                    <text 
                      x={props.viewBox?.cx} 
                      y={props.viewBox?.cy - 5} 
                      textAnchor="middle" 
                      fill={theme.palette.text.secondary}
                      fontSize={10}
                    >
                      {activeIndex !== undefined ? activeStatusData[activeIndex].name : 'Total'}
                    </text>
                    <text 
                      x={props.viewBox?.cx} 
                      y={props.viewBox?.cy + 15} 
                      textAnchor="middle" 
                      fill={activeIndex !== undefined ? activeStatusData[activeIndex].color : theme.palette.text.primary}
                      fontSize={18}
                      fontWeight="bold"
                    >
                      {activeIndex !== undefined 
                        ? `${activeStatusData[activeIndex].value}` 
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