'use client';

import { Typography, Box, useTheme, alpha, Divider, Paper } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip, Rectangle } from 'recharts';
import { useState } from 'react';
import { useServiceAccountStore } from '../store/useServiceAccountStore';
import { Cloud, Database, Server, HardDrive } from 'lucide-react';
import { ClientOnly } from './ClientOnly';

// Define a type for platform data
interface PlatformData {
  name: string;
  count: number;
  color: string;
  percentage: number;
  icon: React.ReactNode;
}

export default function PlatformAnalysis() {
  const { data, filters, setFilter } = useServiceAccountStore();
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Define a color palette for different platforms with colors matching the image exactly
  const platformColors = {
    AWS: '#FF9900', // AWS orange
    Azure: '#0078D4', // Azure blue
    GCP: '#4285F4', // GCP blue
    'On-Premise': '#34A853', // Green
    'IBM Cloud': '#1261FE', // IBM blue
    'Oracle Cloud': '#C74634', // Oracle red
    DATABASE: '#8E44AD', // Purple for DATABASE
    ACTIVE_DIRECTORY: '#16A085', // Teal for ACTIVE_DIRECTORY
    Other: theme.palette.grey[600] // Default color
  };

  // Map platforms to icons with improved handling for database and directory names
  const platformIcons = {
    AWS: <Cloud size={18} />,
    Azure: <Cloud size={18} />,
    GCP: <Cloud size={18} />,
    'On-Premise': <Server size={18} />,
    'IBM Cloud': <Database size={18} />,
    'Oracle Cloud': <Database size={18} />,
    DATABASE: <Database size={18} />,
    ACTIVE_DIRECTORY: <Server size={18} />,
    Other: <HardDrive size={18} />
  };

  // Process data to get platform distribution
  const processPlatformData = (): PlatformData[] => {
    if (!data || data.length === 0) {
      // Return demo data if no real data exists
      return [
        { name: 'DATABASE', count: 510, color: platformColors.DATABASE, percentage: 30, icon: platformIcons.DATABASE },
        { name: 'ACTIVE_DIRECTORY', count: 490, color: platformColors.ACTIVE_DIRECTORY, percentage: 28, icon: platformIcons.ACTIVE_DIRECTORY },
        { name: 'AWS', count: 250, color: platformColors.AWS, percentage: 15, icon: platformIcons.AWS },
        { name: 'Azure', count: 200, color: platformColors.Azure, percentage: 12, icon: platformIcons.Azure },
        { name: 'GCP', count: 180, color: platformColors.GCP, percentage: 10, icon: platformIcons.GCP },
        { name: 'On-Premise', count: 90, color: platformColors['On-Premise'], percentage: 5, icon: platformIcons['On-Premise'] },
      ];
    }

    // Get platform counts from real data
    const platformCounts: Record<string, number> = {};
    data.forEach(item => {
      const platform = item.sa_platform || 'Unknown';
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });

    // Calculate total for percentages
    const total = Object.values(platformCounts).reduce((sum, count) => sum + count, 0);

    // Transform into expected format
    const platformData = Object.entries(platformCounts)
      .map(([name, count]) => {
        const percentage = Math.round((count / total) * 100);
        return {
          name,
          count,
          percentage,
          color: platformColors[name as keyof typeof platformColors] || platformColors.Other,
          icon: platformIcons[name as keyof typeof platformIcons] || platformIcons.Other
        };
      })
      .sort((a, b) => b.count - a.count); // Sort by count descending

    return platformData;
  };

  const platformData = processPlatformData();

  // Custom tooltip for better visualization
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <ClientOnly>
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              padding: '12px',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '8px',
              boxShadow: theme.shadows[3],
              minWidth: '180px',
              backdropFilter: 'blur(10px)',
              background: 'rgba(255, 255, 255, 0.8)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box sx={{ 
                color: data.color,
                display: 'flex',
                alignItems: 'center'
              }}>
                {data.icon}
              </Box>
              <Typography variant="subtitle2" fontWeight="bold" style={{ color: data.color }}>
                {data.name}
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Service Accounts: <strong>{data.count}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Share: <strong>{data.percentage}%</strong>
            </Typography>
          </Box>
        </ClientOnly>
      );
    }
    return null;
  };

  // Display top platforms to match the screenshot
  const maxPlatformsToShow = 6;
  const displayedPlatforms = platformData.slice(0, maxPlatformsToShow);

  // Handle mouse enter for highlighting
  const handleMouseEnter = (data: any, index: number) => {
    setActiveIndex(index);
  };

  // Handle mouse leave for removing highlight
  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  // Handle click for filtering
  const handleClick = (data: any) => {
    setFilter({ platform: data.name === 'Others' ? undefined : data.name });
  };

  // Platform summary statistics
  const platformCount = Object.keys(platformData.reduce((acc, item) => {
    acc[item.name] = true;
    return acc;
  }, {} as Record<string, boolean>)).length;

  const topPlatform = platformData.length > 0 ? platformData[0].name : 'N/A';
  const topPlatformPercentage = platformData.length > 0 ? platformData[0].percentage : 0;

  // Function to format platform name for display
  const formatPlatformName = (name: string): string => {
    // For the specific names in the image
    if (name === 'DATABASE') return 'Database';
    if (name === 'ACTIVE_DIRECTORY') return 'Active Directory';
    
    return name;
  };

  return (
    <Paper 
      elevation={2}
      sx={{ 
        p: { xs: 2, sm: 2.5 },
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        background: alpha(theme.palette.background.paper, 0.8),
        boxShadow: '0 6px 16px rgba(0,0,0,0.05)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="h6" fontWeight="bold" color="primary.main">
          Platform Distribution
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Service accounts by cloud/on-prem platform
        </Typography>
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        mb: 1.5,
        py: 0.75,
        px: 1.5,
        bgcolor: alpha(theme.palette.background.default, 0.5),
        borderRadius: '8px',
        border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
      }}>
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Box sx={{ 
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main
          }}>
            <Database size={16} />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight="medium">
              Total Platforms
            </Typography>
            <Typography variant="h6" color="text.primary" fontWeight="bold">
              {platformCount}
            </Typography>
          </Box>
        </Box>
        
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Box sx={{ 
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.error.main, 0.1),
            color: theme.palette.error.main
          }}>
            <Cloud size={16} />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight="medium" noWrap>
              Top Platform
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="h6" color="text.primary" fontWeight="bold" noWrap>
                {formatPlatformName(topPlatform)}
              </Typography>
              <Box 
                sx={{ 
                  px: 0.75, 
                  py: 0.25, 
                  bgcolor: alpha(theme.palette.error.main, 0.1), 
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                <Typography variant="caption" fontWeight="medium" color="error.main">
                  {topPlatformPercentage}%
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mb: 1.5 }} />
      
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: { xs: '250px', sm: '260px', md: '280px' },
          background: alpha(theme.palette.background.paper, 0.4),
          borderRadius: '8px',
          p: { xs: 0.5, sm: 1 },
          overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={displayedPlatforms}
            margin={{ 
              top: 5, 
              right: 50, 
              left: 5, 
              bottom: 5 
            }}
            barSize={20}
          >
            <XAxis 
              type="number" 
              tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
              axisLine={{ stroke: theme.palette.divider }}
              tickLine={{ stroke: theme.palette.divider }}
              domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={80}
              tick={({ y, payload }) => {
                const name = payload.value;
                const color = platformData.find(p => p.name === name)?.color || theme.palette.text.primary;
                const icon = platformData.find(p => p.name === name)?.icon;
                const formattedName = formatPlatformName(name);
                
                return (
                  <g transform={`translate(0,${y})`}>
                    <text x={-30} y={0} dy={4} textAnchor="end" fill={color} fontSize={12}>
                      {formattedName}
                    </text>
                    <foreignObject x={-25} y={-10} width={20} height={20}>
                      <Box sx={{ color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {icon}
                      </Box>
                    </foreignObject>
                  </g>
                );
              }} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Bar 
              dataKey="count" 
              shape={(props: any) => {
                const { x, y, width, height, index } = props;
                const data = displayedPlatforms[index];
                const isActive = index === activeIndex;
                
                return (
                  <g>
                    <defs>
                      <linearGradient id={`colorBar${index}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={data.color} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={data.color} stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <Rectangle
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={`url(#colorBar${index})`}
                      rx={4}
                      ry={4}
                      opacity={isActive ? 1 : 0.85}
                      stroke={isActive ? alpha(data.color, 0.9) : 'none'}
                      strokeWidth={isActive ? 2 : 0}
                      style={{
                        filter: isActive ? `drop-shadow(0 0 3px ${alpha(data.color, 0.4)})` : 'none',
                        transition: 'all 0.3s ease'
                      }}
                    />
                    <text
                      x={x + width - 8}
                      y={y + height / 2}
                      textAnchor="end"
                      dominantBaseline="central"
                      fill={isActive ? "#fff" : alpha("#fff", 0.9)}
                      style={{ 
                        fontWeight: 'bold', 
                        fontSize: 11,
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                      }}
                    >
                      {data.count}
                    </text>
                    <text
                      x={x + width + 20}
                      y={y + height / 2}
                      textAnchor="start"
                      dominantBaseline="central"
                      fill={theme.palette.text.secondary}
                      style={{ 
                        fontSize: 10,
                        opacity: isActive ? 1 : 0.8
                      }}
                    >
                      {data.percentage}%
                    </text>
                  </g>
                );
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
              cursor="pointer"
              animationDuration={750}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
} 