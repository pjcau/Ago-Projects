import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CatalogPage from './pages/CatalogPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CatalogPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;