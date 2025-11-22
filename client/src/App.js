import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Animals from './pages/Animals';
import MilkProduction from './pages/MilkProduction';
import MilkSales from './pages/MilkSales';
import Expenses from './pages/Expenses';
import Vaccinations from './pages/Vaccinations';
import Calves from './pages/Calves';
import Reports from './pages/Reports';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/animals" element={<PrivateRoute><Animals /></PrivateRoute>} />
              <Route path="/milk/production" element={<PrivateRoute><MilkProduction /></PrivateRoute>} />
              <Route path="/milk/sales" element={<PrivateRoute><MilkSales /></PrivateRoute>} />
              <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
              <Route path="/vaccinations" element={<PrivateRoute><Vaccinations /></PrivateRoute>} />
              <Route path="/calves" element={<PrivateRoute><Calves /></PrivateRoute>} />
              <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
            </Routes>
          </main>
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
