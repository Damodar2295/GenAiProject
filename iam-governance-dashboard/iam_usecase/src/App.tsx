
import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Survey from './components/Survey';

const theme = createTheme({
  palette: {
    primary: {
      main: '#D71E2B',      // Wells Fargo Red
      light: '#E45C66',
      dark: '#96151E',
    },
    secondary: {
      main: '#FDC82F',      // Wells Fargo Yellow
      light: '#FEDD77',
      dark: '#B18B20',
    },
    background: {
      default: '#F6F6F6',   // Light Gray Background
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: [
      'Wells Fargo Sans',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Arial',
      'sans-serif'
    ].join(','),
    h4: {
      fontWeight: 600,
      color: '#D71E2B',
    },
    h6: {
      fontWeight: 500,
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 24px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid #E0E0E0',
        },
      },
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Survey />
    </ThemeProvider>
  );
};

export default App;