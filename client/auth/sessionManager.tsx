import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Mock user type
interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  hasAccessKey: boolean;
  accessKey?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  validateAccessKey: (key: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session
    const storedUser = localStorage.getItem('mr_success_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password?: string) => {
    // Simulate API call
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Admin logic
    const isSuperUser = email === 'blessedsuccess738@gmail.com' || email === 'josephego95@gmail.com';
    const isAdmin = email.includes('admin') || isSuperUser;

    // Clear DB (LocalStorage) for specific admin on login/signup to start fresh
    if (email === 'josephego95@gmail.com') {
      localStorage.clear();
      console.log('Database cleared for admin user.');
    }
    
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      isAdmin,
      hasAccessKey: isSuperUser || isAdmin, // Super user and admins have access by default
    };

    localStorage.setItem('mr_success_user', JSON.stringify(newUser));
    setUser(newUser);
    setLoading(false);
  };

  const signup = async (email: string, password?: string) => {
    // Simulate API call
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const isSuperUser = email === 'blessedsuccess738@gmail.com' || email === 'josephego95@gmail.com';
    const isAdmin = isSuperUser;

    // Clear DB (LocalStorage) for specific admin on login/signup to start fresh
    if (email === 'josephego95@gmail.com') {
      localStorage.clear();
      console.log('Database cleared for admin user.');
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      isAdmin,
      hasAccessKey: isAdmin, // Admins have access by default
    };

    localStorage.setItem('mr_success_user', JSON.stringify(newUser));
    setUser(newUser);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('mr_success_user');
    setUser(null);
  };

  const validateAccessKey = async (key: string): Promise<boolean> => {
    // In a real app, this would check against the database
    // For demo, we accept any key starting with "ACCESS-"
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (key.startsWith('ACCESS-') || key === 'DEMO-KEY') {
      if (user) {
        const updatedUser = { ...user, hasAccessKey: true, accessKey: key };
        localStorage.setItem('mr_success_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, validateAccessKey }}>
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
