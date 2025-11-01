import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Alert,
    Stack,
    Divider,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Microsoft as MicrosoftIcon,
    Login as LoginIcon,
    Business as BusinessIcon
} from '@mui/icons-material';

const MockAzureLogin = ({ onLoginSuccess }) => {
    const [selectedUser, setSelectedUser] = useState('');
    const [customName, setCustomName] = useState('');
    const [customEmail, setCustomEmail] = useState('');
    const [showCustom, setShowCustom] = useState(false);

    // Mock user profiles for testing
    const mockUsers = [
        {
            id: 'admin-user',
            name: 'Admin User',
            email: 'admin@company.com',
            roles: ['admin', 'user'],
            tenantId: 'mock-tenant-123'
        },
        {
            id: 'regular-user',
            name: 'John Smith',
            email: 'john.smith@company.com',
            roles: ['user'],
            tenantId: 'mock-tenant-123'
        },
        {
            id: 'manager-user',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@company.com',
            roles: ['manager', 'user'],
            tenantId: 'mock-tenant-123'
        }
    ];

    const handleMockLogin = (user) => {
        // Simulate the Microsoft login flow
        setTimeout(() => {
            const mockAccount = {
                homeAccountId: `${user.id}-${user.tenantId}`,
                name: user.name,
                username: user.email,
                tenantId: user.tenantId,
                localAccountId: user.id
            };

            // Call the success callback with mock user data
            onLoginSuccess(mockAccount, user.roles);
        }, 1000); // Simulate network delay
    };

    const handleCustomLogin = () => {
        if (!customName || !customEmail) return;

        const customUser = {
            id: 'custom-user',
            name: customName,
            email: customEmail,
            roles: ['user'], // Default to regular user
            tenantId: 'mock-tenant-123'
        };

        handleMockLogin(customUser);
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
                    maxWidth: 500,
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
                            Mock Microsoft Authentication (for testing)
                        </Typography>
                    </Box>

                    <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                            <strong>Mock Mode:</strong> Choose a test user profile or create a custom one. 
                            This simulates Azure AD login without requiring IT setup.
                        </Typography>
                    </Alert>

                    <Stack spacing={2}>
                        <Typography variant="h6" gutterBottom>
                            Select Test User:
                        </Typography>

                        {mockUsers.map((user) => (
                            <Button
                                key={user.id}
                                variant="outlined"
                                fullWidth
                                startIcon={<MicrosoftIcon />}
                                onClick={() => handleMockLogin(user)}
                                sx={{
                                    py: 1.5,
                                    justifyContent: 'flex-start',
                                    textAlign: 'left'
                                }}
                            >
                                <Box>
                                    <Typography variant="body1" fontWeight="bold">
                                        {user.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {user.email} • {user.roles.includes('admin') ? 'Admin' : 'User'}
                                    </Typography>
                                </Box>
                            </Button>
                        ))}

                        <Divider sx={{ my: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                or create custom user
                            </Typography>
                        </Divider>

                        {!showCustom ? (
                            <Button
                                variant="text"
                                onClick={() => setShowCustom(true)}
                                sx={{ py: 1 }}
                            >
                                Create Custom User
                            </Button>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    label="Full Name"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                                <TextField
                                    label="Email Address"
                                    value={customEmail}
                                    onChange={(e) => setCustomEmail(e.target.value)}
                                    fullWidth
                                    size="small"
                                    type="email"
                                />
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="contained"
                                        onClick={handleCustomLogin}
                                        disabled={!customName || !customEmail}
                                        startIcon={<LoginIcon />}
                                        sx={{ flex: 1 }}
                                    >
                                        Login as Custom User
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            setShowCustom(false);
                                            setCustomName('');
                                            setCustomEmail('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Stack>

                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            Mock authentication for development and testing
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default MockAzureLogin;
