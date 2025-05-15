'use client';

import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';
import { Box, Paper, Typography, styled } from '@mui/material';
import { User, LogOut, Settings, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/auth-context';

const StyledContent = styled(Paper)(({ theme }) => ({
  minWidth: 220,
  backgroundColor: theme.palette.background.paper,
  borderRadius: 6,
  padding: theme.spacing(1),
  boxShadow: theme.shadows[3],
  zIndex: 100,
}));

const MenuItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1),
  borderRadius: 4,
  cursor: 'pointer',
  gap: theme.spacing(1),
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.04)',
  },
}));

const AvatarRoot = styled(Avatar.Root)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  verticalAlign: 'middle',
  overflow: 'hidden',
  userSelect: 'none',
  width: 40,
  height: 40,
  borderRadius: '100%',
  backgroundColor: theme.palette.primary.main,
  cursor: 'pointer',
}));

const AvatarImage = styled(Avatar.Image)({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: 'inherit',
});

const AvatarFallback = styled(Avatar.Fallback)(({ theme }) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontSize: 18,
  lineHeight: 1,
  fontWeight: 500,
}));

interface UserProfileDropdownProps {
  userName?: string;
  userImage?: string;
}

export function UserProfileDropdown({ 
  userName,
  userImage
}: UserProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  
  // Use the user data from auth context if available
  const displayName = userName || user?.name || 'Admin User';
  const userRole = user?.role || 'Administrator';
  
  const handleSignOut = () => {
    setOpen(false);
    logout();
  };

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <AvatarRoot>
          {userImage ? (
            <AvatarImage src={userImage} alt={displayName} />
          ) : (
            <AvatarFallback>
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          )}
        </AvatarRoot>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content asChild sideOffset={5} align="end">
          <StyledContent>
            <Box sx={{ p: 1, mb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight="bold">{displayName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {userRole}
              </Typography>
            </Box>
            
            <MenuItem>
              <User size={16} />
              <Typography variant="body2">Profile</Typography>
            </MenuItem>
            
            <MenuItem>
              <Settings size={16} />
              <Typography variant="body2">Settings</Typography>
            </MenuItem>
            
            <MenuItem>
              <HelpCircle size={16} />
              <Typography variant="body2">Help</Typography>
            </MenuItem>
            
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 1, pt: 1 }}>
              <MenuItem onClick={handleSignOut}>
                <LogOut size={16} />
                <Typography variant="body2">Sign out</Typography>
              </MenuItem>
            </Box>
          </StyledContent>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export default UserProfileDropdown; 