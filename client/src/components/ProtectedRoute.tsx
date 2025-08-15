import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  isAuthenticated 
}) => {
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};
