import { AppBar, Toolbar, Typography, Box } from '@mui/material';

export default function DashboardHeader() {
  return (
    <AppBar position="static" sx={{ bgcolor: '#D4001A' }}> {/* Wells Fargo Red */}
      <Toolbar>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Wells Fargo IAM Governance Dashboard
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Last Updated: {new Date().toLocaleDateString()}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
} 