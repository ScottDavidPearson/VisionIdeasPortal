import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [userRoles, setUserRoles] = useState([]);

    // Check for existing session on app load
    useEffect(() => {
        const savedUser = localStorage.getItem('mockAuthUser');
        const savedRoles = localStorage.getItem('mockAuthRoles');
        
        if (savedUser && savedRoles) {
            setUser(JSON.parse(savedUser));
            setUserRoles(JSON.parse(savedRoles));
            setIsAuthenticated(true);
        }
    }, []);

    const login = async (mockAccount, roles) => {
        setIsLoading(true);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const userData = {
            id: mockAccount.homeAccountId,
            name: mockAccount.name,
            email: mockAccount.username,
            tenantId: mockAccount.tenantId,
            localAccountId: mockAccount.localAccountId
        };

        setUser(userData);
        setUserRoles(roles);
        setIsAuthenticated(true);
        
        // Persist session
        localStorage.setItem('mockAuthUser', JSON.stringify(userData));
        localStorage.setItem('mockAuthRoles', JSON.stringify(roles));
        
        setIsLoading(false);
    };

    const logout = async () => {
        setIsLoading(true);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setUser(null);
        setUserRoles([]);
        setIsAuthenticated(false);
        
        // Clear session
        localStorage.removeItem('mockAuthUser');
        localStorage.removeItem('mockAuthRoles');
        
        setIsLoading(false);
    };

    const getAccessToken = async () => {
        // Return a mock token for API calls
        return `mock-token-${user?.id}-${Date.now()}`;
    };

    const hasRole = (role) => {
        return userRoles.includes(role);
    };

    const isAdmin = () => {
        return hasRole('admin') || hasRole('administrator');
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        userRoles,
        login,
        logout,
        getAccessToken,
        hasRole,
        isAdmin,
        // Mock MSAL properties for compatibility
        account: user ? {
            homeAccountId: user.id,
            name: user.name,
            username: user.email,
            tenantId: user.tenantId,
            localAccountId: user.localAccountId
        } : null,
        inProgress: isLoading ? 'login' : 'none'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
