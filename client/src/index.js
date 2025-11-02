import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from './authConfig';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <MsalProvider instance={msalInstance}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </MsalProvider>
);
