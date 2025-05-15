'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../context/auth-context';
import { Box, CircularProgress, Typography } from '@mui/material';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      // User is not authenticated and not on login page
      if (!user && pathname !== '/login') {
        router.push('/login');
      } 
      // User is authenticated and on login page
      else if (user && pathname === '/login') {
        router.push('/');
      }
      setChecking(false);
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading || checking) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          gap: 2
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Checking authentication...
        </Typography>
      </Box>
    );
  }

  // If on login page or authenticated, render children
  if (pathname === '/login' || user) {
    return <>{children}</>;
  }

  // This should not normally be visible as the router.push above should redirect
  return null;
} 