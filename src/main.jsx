import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';   
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { HospitalProvider } from './context/HospitalContext';
import { PermissionProvider } from './context/PermissionContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(

    <BrowserRouter>          
      <AuthProvider>
        <HospitalProvider>
          <PermissionProvider> 
          <App />
          </PermissionProvider>
        </HospitalProvider>
      </AuthProvider>
    </BrowserRouter>
);