'use client';

import { Button } from '@mui/material';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import { useServiceAccountStore } from '../store/useServiceAccountStore';

export default function ResetFiltersButton() {
  const { resetFilters, filters } = useServiceAccountStore();
  
  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== undefined);
  
  return (
    <Button
      variant="outlined"
      color="secondary"
      startIcon={<FilterAltOffIcon />}
      onClick={resetFilters}
      disabled={!hasActiveFilters}
      sx={{ my: 2 }}
    >
      Reset Filters
    </Button>
  );
} 