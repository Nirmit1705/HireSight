import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleLogin } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const wasGoogleAuth = localStorage.getItem('googleAuthInProgress');
    
    console.log('AuthSuccess: URL params:', window.location.search);
    console.log('AuthSuccess: Token from params:', token);
    console.log('AuthSuccess: Was Google auth in progress:', wasGoogleAuth);
    console.log('AuthSuccess: window.opener:', window.opener);
    console.log('AuthSuccess: !!window.opener:', !!window.opener);
    
    if (token) {
      console.log('AuthSuccess: Token found, storing in localStorage');
      localStorage.setItem('authToken', token);
      
      // Clear the Google auth progress flag
      if (wasGoogleAuth) {
        localStorage.removeItem('googleAuthInProgress');
      }
      
      // For redirect flow (no popup), call handleLogin directly
      console.log('AuthSuccess: Redirect flow - calling handleLogin');
      handleLogin();
    } else {
      console.log('AuthSuccess: No token found, redirecting to landing page');
      // Clear the Google auth progress flag
      if (wasGoogleAuth) {
        localStorage.removeItem('googleAuthInProgress');
      }
      
      // Regular redirect flow - navigate back to landing page
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
  }, [searchParams, navigate, handleLogin]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p>Completing authentication...</p>
        {searchParams.get('token') && (
          <p className="mt-2 text-green-600">Success! Redirecting to dashboard...</p>
        )}
      </div>
    </div>
  );
};

export default AuthSuccess;
