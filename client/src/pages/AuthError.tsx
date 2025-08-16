import { useEffect } from 'react';

const AuthError = () => {
  useEffect(() => {
    // Send error message to parent window
    window.opener?.postMessage(
      { type: 'GOOGLE_AUTH_ERROR' },
      window.location.origin
    );
    
    // Close the popup after a short delay
    setTimeout(() => {
      window.close();
    }, 2000);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-red-500 text-xl mb-4">Authentication Failed</div>
        <p>This window will close automatically...</p>
      </div>
    </div>
  );
};

export default AuthError;
