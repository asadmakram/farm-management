import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider } from './context/AuthContext.jsx';

// Components
import Sidebar from './components/Sidebar.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';

// Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Animals from './pages/Animals.jsx';
import MilkProduction from './pages/MilkProduction.jsx';
import MilkSales from './pages/MilkSales.jsx';
import Expenses from './pages/Expenses.jsx';
import Vaccinations from './pages/Vaccinations.jsx';
import Calves from './pages/Calves.jsx';
import Reports from './pages/Reports.jsx';
import Contracts from './pages/Contracts.jsx';
import RecurringExpenses from './pages/RecurringExpenses.jsx';
import Reminders from './pages/Reminders.jsx';
import Settings from './pages/Settings.jsx';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <div className="App d-flex">
          <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            setIsCollapsed={setIsSidebarCollapsed}
            isMobileOpen={isMobileSidebarOpen}
            setIsMobileOpen={setIsMobileSidebarOpen}
          />
          <div
            className="main-content flex-grow-1"
            style={{
              marginLeft: window.innerWidth > 768 ? (isSidebarCollapsed ? '70px' : '280px') : '0',
              transition: 'margin-left 0.3s ease',
              width: '100%'
            }}
          >
            <main className="p-2 p-md-4">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/animals" element={<PrivateRoute><Animals /></PrivateRoute>} />
                <Route path="/milk/production" element={<PrivateRoute><MilkProduction /></PrivateRoute>} />
                <Route path="/milk/sales" element={<PrivateRoute><MilkSales /></PrivateRoute>} />
                <Route path="/contracts" element={<PrivateRoute><Contracts /></PrivateRoute>} />
                <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
                <Route path="/recurring-expenses" element={<PrivateRoute><RecurringExpenses /></PrivateRoute>} />
                <Route path="/vaccinations" element={<PrivateRoute><Vaccinations /></PrivateRoute>} />
                <Route path="/reminders" element={<PrivateRoute><Reminders /></PrivateRoute>} />
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
