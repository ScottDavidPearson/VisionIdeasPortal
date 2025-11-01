import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../contexts/MockAuthContext';
import MockAzureLogin from './MockAzureLogin';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { isAuthenticated, isLoading, isAdmin, user, login } = useAuth();

    // Show loading spinner while authentication is being determined
    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    gap: 2
                }}
            >
                <CircularProgress size={60} />
                <Typography variant="h6" color="text.secondary">
                    Authenticating...
                </Typography>
            </Box>
        );
    }

    // If not authenticated, show login page
    if (!isAuthenticated) {
        return <MockAzureLogin onLoginSuccess={login} />;
    }

    // If admin is required but user is not admin, show access denied
    if (requireAdmin && !isAdmin()) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    gap: 2,
                    p: 3
                }}
            >
                <Typography variant="h4" color="error" gutterBottom>
                    Access Denied
                </Typography>
                <Typography variant="body1" color="text.secondary" textAlign="center">
                    You don't have permission to access this area. 
                    Please contact your administrator if you believe this is an error.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Signed in as: {user?.name} ({user?.email})
                </Typography>
            </Box>
        );
    }

    // If authenticated (and admin if required), render the protected content
    return children;
};

export default ProtectedRoute;
