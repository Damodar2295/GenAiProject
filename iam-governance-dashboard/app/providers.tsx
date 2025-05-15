'use client';

import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/auth-context';

// Create professional Wells Fargo theme (light mode only)
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#D4001A', // Wells Fargo Red
      light: '#FF405A',
      dark: '#B30017',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#6E6E73', // Neutral gray
      light: '#8E8E93',
      dark: '#3A3A3C',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F5F7', // Light gray
      paper: '#FFFFFF',
    },
    warning: {
      main: '#FF9500',
      light: '#FFAC33',
      dark: '#CC7600',
    },
    success: {
      main: '#34C759',
      light: '#65D380',
      dark: '#248A3D',
    },
    info: {
      main: '#5AC8FA',
      light: '#81D6FB',
      dark: '#0B87C5',
    },
    error: {
      main: '#FF3B30',
      light: '#FF6B64',
      dark: '#CC2F26',
    },
    text: {
      primary: '#1D1D1F', // Almost black
      secondary: '#6E6E73', // Neutral gray
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 600,
      fontSize: '2.5rem',
      letterSpacing: '-0.021em',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      letterSpacing: '-0.021em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      letterSpacing: '-0.021em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '-0.018em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      letterSpacing: '-0.015em',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      letterSpacing: '-0.012em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '-0.01em',
    },
    body1: {
      letterSpacing: '-0.01em',
    },
    body2: {
      letterSpacing: '-0.01em',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
          margin: 0,
          padding: 0,
        },
        html: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        body: {
          transition: 'background-color 0.2s ease-in-out, color 0.2s ease-in-out',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.04)',
          border: 'none',
        },
        elevation1: {
          backgroundColor: '#FFFFFF',
          boxShadow: '0 2px 10px 0 rgba(0,0,0,0.03)',
        },
        elevation2: {
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.06)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          boxShadow: 'none',
          color: '#1D1D1F',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          padding: '8px 16px',
          letterSpacing: '-0.01em',
          '&:hover': {
            boxShadow: '0 4px 10px 0 rgba(0,0,0,0.1)',
          },
        },
        containedPrimary: {
          background: '#D4001A', // Wells Fargo Red
          '&:hover': {
            background: '#FF405A',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #8E8E93 0%, #6E6E73 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #AEAEB2 0%, #8E8E93 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          padding: 16,
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.04)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          border: 'none',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 30px 0 rgba(0,0,0,0.08)',
          }
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          padding: '16px 24px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: 'rgba(0, 0, 0, 0.01)',
        }
      }
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
        }
      }
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
        }
      }
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 0, 0, 0.1)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 0, 0, 0.2)',
          },
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#FFFFFF',
          },
          '&.Mui-focused': {
            backgroundColor: '#FFFFFF',
          },
          '&.Mui-disabled': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          }
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: 'rgba(0, 0, 0, 0.6)',
          '&.Mui-focused': {
            color: '#D4001A', // Wells Fargo Red
          }
        }
      }
    },
  },
});

// Create a ClientOnly wrapper component to prevent hydration mismatches
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  if (!hasMounted) {
    return null;
  }
  
  return <>{children}</>;
}

export function Providers({ 
  children,
  fontFamily
}: { 
  children: React.ReactNode;
  fontFamily: string;
}) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // This helps avoid hydration mismatch with MUI components
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        {/* Only render children when mounted to prevent hydration issues with MUI */}
        {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
      </AuthProvider>
    </ThemeProvider>
  );
}