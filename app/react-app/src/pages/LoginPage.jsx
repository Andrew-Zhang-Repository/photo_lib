import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import { useAuth } from '../context/AuthContext';
import '@aws-amplify/ui-react/styles.css';


function AuthRedirect({ user, onSuccess }) {
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (user && !hasRedirected.current) {
      hasRedirected.current = true;
      onSuccess().then(() => {
        navigate('/dashboard', { replace: true });
      });
    }
  }, [user, navigate, onSuccess]);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      Logging you in...
    </div>
  );
}

function LoginPage() {
  const { isAuthenticated, checkAuth } = useAuth();
  const navigate = useNavigate();

  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="login-page">
      <Authenticator signUpAttributes={['email', 'preferred_username']}>
        {({ user }) => (
          <AuthRedirect user={user} onSuccess={checkAuth} />
        )}
      </Authenticator>
    </div>
  );
}

export default LoginPage;