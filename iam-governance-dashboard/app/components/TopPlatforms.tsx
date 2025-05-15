'use client';

import { Typography, Box, useTheme, alpha, Grid, Card } from '@mui/material';
import { useState } from 'react';
import { useServiceAccountStore } from '../store/useServiceAccountStore';
import { Award, Cloud, Database, Server, HardDrive } from 'lucide-react';
import { ClientOnly } from './ClientOnly';

// Define a type for platform data
interface PlatformData {
  name: string;
  count: number;
  color: string;
  percentage: number;
  icon: React.ReactNode;
}

export default function TopPlatforms() {
  const { data, setFilter } = useServiceAccountStore();
  const theme = useTheme();

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

  // Handle click for filtering
  const handleClick = (data: any) => {
    setFilter({ platform: data.name === 'Others' ? undefined : data.name });
  };

  // Function to format platform name for display
  const formatPlatformName = (name: string): string => {
    // For the specific names in the image
    if (name === 'DATABASE') return 'Database';
    if (name === 'ACTIVE_DIRECTORY') return 'Active Directory';
    
    return name;
  };

  // Top 3 platforms for featured display
  const topPlatforms = platformData.slice(0, 3);

  return (
    <Box 
      sx={{ 
        p: { xs: 2, sm: 3 },
        borderRadius: '12px', 
        background: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(8px)', 
        boxShadow: '0 6px 16px rgba(0,0,0,0.05)', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        mb: 2.5 
      }}>
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
          <Award size={20} color={theme.palette.primary.main} />
        </Box>
        <Typography variant="h6" fontWeight="bold" color="primary.main">
          Top Platforms
        </Typography>
      </Box>
      
      <Grid 
        container 
        spacing={{ xs: 2, sm: 2.5, md: 3 }} 
        sx={{ 
          flexGrow: 1,
          mt: 0.5,
          alignContent: 'flex-start',
          maxHeight: '265px',
          overflow: 'auto'
        }}
      >
        {topPlatforms.map((platform, index) => (
          <Grid item xs={12} key={platform.name}>
            <Card
              sx={{
                p: { xs: 1.5, sm: 2 },
                height: '100%',
                borderRadius: 2,
                cursor: 'pointer',
                position: 'relative',
                background: `linear-gradient(135deg, ${alpha(platform.color, 0.08)} 0%, transparent 100%)`,
                border: `1px solid ${alpha(platform.color, 0.2)}`,
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 6px 16px ${alpha(platform.color, 0.15)}`,
                  borderColor: alpha(platform.color, 0.5),
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '4px',
                  height: '100%',
                  backgroundColor: platform.color,
                  borderTopLeftRadius: '8px',
                  borderBottomLeftRadius: '8px',
                }
              }}
              onClick={() => handleClick(platform)}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Box sx={{ color: platform.color, fontSize: 24 }}>
                  {platform.icon}
                </Box>
                <Typography variant="h5" fontWeight="bold" color={platform.color}>
                  {platform.percentage}%
                </Typography>
              </Box>
              
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {formatPlatformName(platform.name)}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {platform.count} service accounts
              </Typography>
              
              <Box sx={{ 
                width: '100%', 
                height: 4, 
                mt: 'auto', 
                pt: 1,
                backgroundColor: alpha(platform.color, 0.2),
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  width: `${platform.percentage}%`, 
                  height: '100%', 
                  backgroundColor: platform.color,
                  borderRadius: 2
                }} />
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
} 