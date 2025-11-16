import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';

const LoginDialog = ({ open, onClose, onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field) => (event) => {
    setCredentials(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Username and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting login with credentials:', credentials.username);
      const response = await axios.post('/api/auth/login', credentials, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        timeout: 10000
      });
      
      console.log('✅ Login API response:', response.data);
      if (response.data.success) {
        // Store token in localStorage
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.user));
        
        onLoginSuccess(response.data.user);
        handleClose();
      } else {
        setError(response.data.error || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        setError('Authentication failed. Please enter the ngrok credentials (jestais/secure123) in the popup, then try again.');
      } else if (error.code === 'ECONNABORTED') {
        setError('Request timeout. Please check your connection and try again.');
      } else {
        setError(error.response?.data?.error || error.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCredentials({ username: '', password: '' });
    setError('');
    setShowPassword(false);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <LoginIcon color="primary" />
            <Typography variant="h6" component="div">
              Product Team Login
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Please log in to access the Product Team management dashboard.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Username"
            value={credentials.username}
            onChange={handleChange('username')}
            margin="normal"
            required
            disabled={loading}
            autoComplete="username"
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={credentials.password}
            onChange={handleChange('password')}
            margin="normal"
            required
            disabled={loading}
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    disabled={loading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Demo Credentials:</strong><br />
              Username: <code>admin</code><br />
              Password: <code>admin123</code>
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
            disabled={loading || !credentials.username.trim() || !credentials.password.trim()}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default LoginDialog;
