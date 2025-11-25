import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider } from './context/AuthContext';

// Components
import Sidebar from './components/Sidebar';
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
import Contracts from './pages/Contracts';
import RecurringExpenses from './pages/RecurringExpenses';
import Currencies from './pages/Currencies';
import Settings from './pages/Settings';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <div className="App d-flex">
          <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
          <div
            className="main-content flex-grow-1"
            style={{
              marginLeft: isSidebarCollapsed ? '70px' : '280px',
              transition: 'margin-left 0.3s ease'
            }}
          >
            <main className="p-4">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/animals" element={<PrivateRoute><Animals /></PrivateRoute>} />
                <Route path="/milk/production" element={<PrivateRoute><MilkProduction /></PrivateRoute>} />
                <Route path="/milk/sales" element={<PrivateRoute><MilkSales /></PrivateRoute>} />
                <Route path="/contracts" element={<PrivateRoute><Contracts /></PrivateRoute>} />
                <Route path="/currencies" element={<PrivateRoute><Currencies /></PrivateRoute>} />
                <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
                <Route path="/recurring-expenses" element={<PrivateRoute><RecurringExpenses /></PrivateRoute>} />
                <Route path="/vaccinations" element={<PrivateRoute><Vaccinations /></PrivateRoute>} />
                <Route path="/calves" element={<PrivateRoute><Calves /></PrivateRoute>} />
                <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
              </Routes>
            </main>
          </div>
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
