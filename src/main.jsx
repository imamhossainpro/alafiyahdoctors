// src/main.jsx
// ==================================================
// 🚀 Application Entry Point
// ==================================================
// ✅ React 18+ createRoot
// ✅ BrowserRouter for SPA routing
// ✅ Context Providers (Auth, Hospital, Permission)
// ✅ Global CSS imports
// ==================================================
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { HospitalProvider } from './context/HospitalContext';
import { PermissionProvider } from './context/PermissionContext';
import './index.css';
import './fonts.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <HospitalProvider>
          <PermissionProvider>
            <App />
          </PermissionProvider>
        </HospitalProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);