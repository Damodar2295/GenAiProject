'use client';

import { Typography, Box, useTheme } from '@mui/material';
import { useServiceAccountStore } from '../store/useServiceAccountStore';
import { useState } from 'react';
import { alpha } from '@mui/material/styles';

export default function PasswordExpiry() {
  const { filteredData, setFilter } = useServiceAccountStore();
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Process data to get password expiry distribution
  const processExpiryData = () => {
    // Define standard expiry intervals
    const expiryCategories = {
      'Expired': 0,
      '< 30 days': 0,
      '30-90 days': 0,
      '> 90 days': 0,
      'Never': 0
    };
    
    // Group accounts by these intervals
    filteredData.forEach(account => {
      if (account.sa_password_expired) {
        expiryCategories['Expired']++;
      } else if (!account.sa_password_expiry) {
        expiryCategories['Never']++;
      } else {
        const expiryDate = new Date(account.sa_password_expiry);
        const now = new Date();
        const daysToExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        
        if (daysToExpiry <= 30) {
          expiryCategories['< 30 days']++;
        } else if (daysToExpiry <= 90) {
          expiryCategories['30-90 days']++;
        } else {
          expiryCategories['> 90 days']++;
        }
      }
    });
    
    // Map to chart data format with colors
    return Object.entries(expiryCategories).map(([name, value]) => ({
      name,
      value,
      color: name === 'Expired' ? theme.palette.error.main :
             name === '< 30 days' ? theme.palette.warning.main :
             name === '30-90 days' ? theme.palette.info.main :
             name === '> 90 days' ? theme.palette.success.main :
             theme.palette.grey[500]  // 'Never'
    }));
  };

  const expiryData = processExpiryData();

  const handleItemClick = (item: typeof expiryData[0], index: number) => {
    setActiveIndex(index === activeIndex ? null : index);
    // Add filter logic here if needed
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Title with count */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 1,
      }}>
        <Typography variant="caption" fontWeight="medium" color="text.secondary">
          Password expiry status ({filteredData.length})
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Count (%)
        </Typography>
      </Box>
      
      {/* Expiry bars */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {expiryData.map((item, index) => (
          <Box 
            key={index} 
            sx={{ 
              mb: 1.5,
              cursor: 'pointer',
              opacity: activeIndex === null || activeIndex === index ? 1 : 0.6,
              transition: 'opacity 0.2s ease',
              '&:hover': {
                opacity: 1,
                '& .bar-fill': {
                  boxShadow: `0 0 4px ${alpha(item.color, 0.5)}`
                }
              }
            }}
            onClick={() => handleItemClick(item, index)}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box 
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: item.color 
                  }} 
                />
                <Typography variant="caption" color="text.secondary">
                  {item.name}
                </Typography>
              </Box>
              <Typography variant="caption" fontWeight="medium" sx={{ color: item.color }}>
                {item.value} ({Math.round((item.value / filteredData.length) * 100)}%)
              </Typography>
            </Box>
            
            <Box sx={{ 
              width: '100%', 
              height: '6px', 
              backgroundColor: alpha(item.color, 0.15),
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <Box 
                className="bar-fill"
                sx={{ 
                  width: `${Math.round((item.value / filteredData.length) * 100)}%`, 
                  height: '100%', 
                  backgroundColor: item.color,
                  borderRadius: '3px',
                  transition: 'all 0.2s ease-in-out',
                }}
              />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
} 