'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  FormControl,
  InputLabel,
  InputAdornment,
  IconButton,
  OutlinedInput,
  Alert,
  CircularProgress 
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { useAuth } from '../context/auth-context';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const router = useRouter();
  const { login, user, isLoading } = useAuth();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (user && !isLoading) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLocalLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        router.push('/');
      } else {
        setErrorMessage('Invalid username or password');
      }
    } catch (error) {
      setErrorMessage('An error occurred during login');
      console.error('Login error:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  // Show loading indicator while checking initial authentication state
  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100vh',
          bgcolor: '#f5f5f5'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh',
        p: 2,
        bgcolor: '#f5f5f5',
        backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(0, 0, 0, 0.025) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(0, 0, 0, 0.025) 2%, transparent 0%)',
        backgroundSize: '100px 100px',
        backgroundPosition: '0 0, 50px 50px',
      }}
    >
      <Paper 
        elevation={4} 
        sx={{ 
          p: 4, 
          borderRadius: 2, 
          maxWidth: 400, 
          width: '100%',
          mb: 4,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '4px', 
            bgcolor: 'primary.main' 
          }} 
        />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 60,
              borderRadius: '50%',
              bgcolor: 'rgba(24, 80, 202, 0.1)',
              mb: 2
            }}
          >
            <Shield size={30} color="#1850CA" />
          </Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            IAM Governance Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Enter your credentials to access the dashboard
          </Typography>
        </Box>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleLogin}>
          <TextField
            label="Username"
            variant="outlined"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
            placeholder="admin"
          />

          <FormControl fullWidth margin="normal" variant="outlined">
            <InputLabel htmlFor="password">Password</InputLabel>
            <OutlinedInput
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="password"
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </IconButton>
                </InputAdornment>
              }
              label="Password"
            />
          </FormControl>

          <Box sx={{ mt: 3, mb: 2 }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={localLoading}
              startIcon={localLoading ? <CircularProgress size={20} /> : <LockKeyhole size={20} />}
              sx={{ py: 1.2 }}
            >
              {localLoading ? 'Logging in...' : 'Log In'}
            </Button>
          </Box>
        </form>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Hint:</strong> Use username <code>admin</code> and password <code>password</code>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
} 