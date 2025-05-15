import { Box, CircularProgress, Typography } from '@mui/material';

export default function LoadingSpinner() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress size={60} sx={{ color: '#D4001A' }} />
      <Typography variant="h6" color="text.secondary">
        Loading IAM Governance Data...
      </Typography>
    </Box>
  );
} 