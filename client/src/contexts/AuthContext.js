import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal, useAccount } from "@azure/msal-react";
import { loginRequest } from '../authConfig';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const { instance, accounts, inProgress } = useMsal();
    const account = useAccount(accounts[0] || {});
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userRoles, setUserRoles] = useState([]);

    useEffect(() => {
        if (account) {
            setUser({
                id: account.homeAccountId,
                name: account.name,
                email: account.username,
                tenantId: account.tenantId,
                localAccountId: account.localAccountId
            });
            setIsAuthenticated(true);
            
            // TODO: Fetch user roles from your backend API
            // For now, we'll set a default role
            setUserRoles(['user']); // Will be replaced with actual role fetching
        } else {
            setUser(null);
            setIsAuthenticated(false);
            setUserRoles([]);
        }
        setIsLoading(false);
    }, [account]);

    const login = async () => {
        try {
            setIsLoading(true);
            await instance.loginPopup(loginRequest);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const loginRedirect = async () => {
        try {
            setIsLoading(true);
            await instance.loginRedirect(loginRequest);
        } catch (error) {
            console.error('Login redirect failed:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);
            await instance.logoutPopup({
                postLogoutRedirectUri: process.env.REACT_APP_POST_LOGOUT_REDIRECT_URI || "http://localhost:3001",
                mainWindowRedirectUri: process.env.REACT_APP_POST_LOGOUT_REDIRECT_URI || "http://localhost:3001"
            });
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const getAccessToken = async () => {
        if (!account) {
            throw new Error('No account available');
        }

        try {
            const response = await instance.acquireTokenSilent({
                ...loginRequest,
                account: account
            });
            return response.accessToken;
        } catch (error) {
            console.error('Token acquisition failed:', error);
            // If silent token acquisition fails, try interactive
            try {
                const response = await instance.acquireTokenPopup(loginRequest);
                return response.accessToken;
            } catch (interactiveError) {
                console.error('Interactive token acquisition failed:', interactiveError);
                throw interactiveError;
            }
        }
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
        loginRedirect,
        logout,
        getAccessToken,
        hasRole,
        isAdmin,
        account,
        inProgress
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
