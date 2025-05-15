'use client';

import { Chip, Box, Typography } from '@mui/material';
import { useServiceAccountStore } from '../store/useServiceAccountStore';

export default function ActiveFilters() {
  const { filters, setFilter } = useServiceAccountStore();
  
  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== undefined);
  
  if (!hasActiveFilters) {
    return null;
  }
  
  // Format filter keys for display
  const formatKey = (key: string) => {
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
  };
  
  // Handle removing a specific filter
  const handleDelete = (key: string) => {
    setFilter({ [key]: undefined });
  };
  
  return (
    <Box sx={{ mb: 2, mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        Active Filters:
      </Typography>
      {Object.entries(filters)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => (
          <Chip
            key={key}
            label={`${formatKey(key)}: ${value}`}
            onDelete={() => handleDelete(key)}
            color="primary"
            variant="outlined"
            size="small"
          />
        ))}
    </Box>
  );
} 