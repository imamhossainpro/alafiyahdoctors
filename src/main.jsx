// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';   // ← ইমপোর্ট করুন
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { HospitalProvider } from './context/HospitalContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>          {/* ← Router যোগ করুন */}
      <AuthProvider>
        <HospitalProvider>
          <App />
        </HospitalProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);