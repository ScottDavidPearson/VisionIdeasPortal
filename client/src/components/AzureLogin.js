import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Stack,
    Divider
} from '@mui/material';
import {
    Microsoft as MicrosoftIcon,
    Login as LoginIcon,
    Business as BusinessIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const AzureLogin = () => {
    const { login, loginRedirect, isLoading } = useAuth();
    const [error, setError] = useState('');
    const [loginMethod, setLoginMethod] = useState('popup'); // 'popup' or 'redirect'

    const handleLogin = async (method) => {
        try {
            setError('');
            if (method === 'popup') {
                await login();
            } else {
                await loginRedirect();
            }
        } catch (error) {
            console.error('Login error:', error);
            setError(error.message || 'Login failed. Please try again.');
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                p: 2
            }}
        >
            <Card
                sx={{
                    maxWidth: 400,
                    width: '100%',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    borderRadius: 2
                }}
            >
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <BusinessIcon 
                            sx={{ 
                                fontSize: 48, 
                                color: 'primary.main', 
                                mb: 2 
                            }} 
                        />
                        <Typography variant="h4" component="h1" gutterBottom>
                            Vision Ideas Portal
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Sign in with your Microsoft account to access the admin dashboard
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Stack spacing={2}>
                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <MicrosoftIcon />}
                            onClick={() => handleLogin('popup')}
                            disabled={isLoading}
                            sx={{
                                py: 1.5,
                                backgroundColor: '#0078d4',
                                '&:hover': {
                                    backgroundColor: '#106ebe'
                                }
                            }}
                        >
                            {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
                        </Button>

                        <Divider sx={{ my: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                or
                            </Typography>
                        </Divider>

                        <Button
                            variant="outlined"
                            size="large"
                            fullWidth
                            startIcon={<LoginIcon />}
                            onClick={() => handleLogin('redirect')}
                            disabled={isLoading}
                            sx={{ py: 1.5 }}
                        >
                            Sign in with Redirect
                        </Button>
                    </Stack>

                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            Secure authentication powered by Microsoft Azure AD
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default AzureLogin;
