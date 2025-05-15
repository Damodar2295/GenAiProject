import { AppBar, Toolbar, Typography, Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function DashboardHeader() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        bgcolor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 600, 
              color: theme.palette.text.primary,
              letterSpacing: '-0.018em'
            }}
          >
            IAM Governance Dashboard
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.palette.text.secondary,
              letterSpacing: '-0.01em' 
            }}
          >
            Last Updated: {new Date().toLocaleDateString()}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
} 