import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  typography: {
    fontFamily: [
      'Graphik',
      'Wells Fargo Sans',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'sans-serif'
    ].join(','),
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    }
  },
  palette: {
    primary: {
      main: '#D71E2B',
      light: '#E45C66',
      dark: '#96151E',
    },
    secondary: {
      main: '#FDC82F',
      light: '#FEDD77',
      dark: '#B18B20',
    },
    background: {
      default: '#F6F6F6',
      paper: '#FFFFFF',
    },
  },
});