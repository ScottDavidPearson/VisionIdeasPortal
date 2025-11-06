import React, { useState, useEffect } from 'react';
import {
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Avatar
} from '@mui/material';
import {
  Microsoft as MicrosoftIcon,
  Login as LoginIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';

// Microsoft Graph Explorer public client - no IT approval needed
const GRAPH_EXPLORER_CLIENT_ID = '04b07795-8ddb-461a-bbee-02f9e1bf7b46';
const REDIRECT_URI = window.location.origin;

const GraphExplorerAuth = ({ onUserChange }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('graphExplorerUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      onUserChange?.(userData);
    }
  }, [onUserChange]);

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Microsoft Graph Explorer OAuth flow
      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${GRAPH_EXPLORER_CLIENT_ID}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `scope=openid profile User.Read&` +
        `response_mode=query&` +
        `state=${Date.now()}`;

      // Open popup for authentication
      const popup = window.open(
        authUrl,
        'microsoftAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for popup completion
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setLoading(false);
          
          // Check if authentication was successful
          const savedUser = localStorage.getItem('graphExplorerUser');
          if (savedUser) {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            onUserChange?.(userData);
          } else {
            setError('Authentication was cancelled or failed');
          }
        }
      }, 1000);

      // Handle popup message (if auth completes)
      const handleMessage = (event) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GRAPH_AUTH_SUCCESS') {
          const userData = event.data.user;
          localStorage.setItem('graphExplorerUser', JSON.stringify(userData));
          setUser(userData);
          onUserChange?.(userData);
          popup.close();
          setLoading(false);
        } else if (event.data.type === 'GRAPH_AUTH_ERROR') {
          setError(event.data.error);
          popup.close();
          setLoading(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Cleanup
      setTimeout(() => {
        if (!popup.closed) {
          popup.close();
          setLoading(false);
          setError('Authentication timeout');
        }
        window.removeEventListener('message', handleMessage);
      }, 60000); // 1 minute timeout

    } catch (err) {
      console.error('Graph Explorer auth error:', err);
      setError('Authentication failed');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('graphExplorerUser');
    setUser(null);
    onUserChange?.(null);
  };

  if (user) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: '#0078d4' }}>
                <MicrosoftIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{user.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
                <Typography variant="caption" color="primary">
                  Authenticated via Microsoft Graph Explorer
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Microsoft Graph Explorer Authentication</strong><br />
          This uses Microsoft's public Graph Explorer app - no IT approval needed!
          Works with any Microsoft account (personal or work).
        </Typography>
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        size="large"
        startIcon={loading ? <CircularProgress size={20} /> : <MicrosoftIcon />}
        onClick={handleLogin}
        disabled={loading}
        sx={{
          bgcolor: '#0078d4',
          '&:hover': { bgcolor: '#106ebe' },
          width: '100%'
        }}
      >
        {loading ? 'Authenticating...' : 'Sign in with Microsoft'}
      </Button>

      <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center' }}>
        Uses Microsoft Graph Explorer (no configuration required)
      </Typography>
    </Box>
  );
};

export default GraphExplorerAuth;
