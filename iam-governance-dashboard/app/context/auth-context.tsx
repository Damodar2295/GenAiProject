'use client';

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  username: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dummy credentials (in a real app, these would be verified against a backend)
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'password';

// Safe localStorage access helper function
const getLocalStorage = () => {
  if (typeof window !== 'undefined') {
    return window.localStorage;
  }
  return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing login on page load
    const storage = getLocalStorage();
    if (storage) {
      const storedUser = storage.getItem('iamDashboardUser');
      
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          storage.removeItem('iamDashboardUser');
        }
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      const userData: User = {
        username: 'admin',
        name: 'Admin User',
        role: 'Administrator'
      };
      
      setUser(userData);
      const storage = getLocalStorage();
      if (storage) {
        storage.setItem('iamDashboardUser', JSON.stringify(userData));
      }
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    const storage = getLocalStorage();
    if (storage) {
      storage.removeItem('iamDashboardUser');
    }
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 