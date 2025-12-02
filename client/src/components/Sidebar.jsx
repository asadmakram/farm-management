import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  FaHome, FaTint, FaMoneyBillWave, FaSyringe,
  FaBaby, FaChartBar, FaSignOutAlt,
  FaFileContract, FaRedoAlt, FaCoins, FaCog, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { GiCow } from 'react-icons/gi';
import 'bootstrap/dist/css/bootstrap.min.css';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './Sidebar.css';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currencies, setCurrencies] = useState([]);
  const [preferredCurrency, setPreferredCurrency] = useState(user?.preferredCurrency || 'INR');

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrencies();
    }
  }, [isAuthenticated]);

  const fetchCurrencies = async () => {
    try {
      const response = await api.get('/currencies');
      setCurrencies(response.data.currencies || []);
    } catch (error) {
      console.error('Error fetching currencies');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCurrencyChange = async (currencyCode) => {
    try {
      await api.put('/auth/preferred-currency', { preferredCurrency: currencyCode });
      setPreferredCurrency(currencyCode);
      // Update user in localStorage
      const updatedUser = { ...user, preferredCurrency: currencyCode };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Preferred currency updated');
    } catch (error) {
      toast.error('Error updating preferred currency');
    }
  };

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: <FaHome /> },
    { path: '/animals', label: 'Animals', icon: <GiCow /> },
    { path: '/milk/production', label: 'Milk Production', icon: <FaTint /> },
    { path: '/milk/sales', label: 'Milk Sales', icon: <FaMoneyBillWave /> },
    { path: '/contracts', label: 'Contracts', icon: <FaFileContract /> },
    { path: '/currencies', label: 'Currencies', icon: <FaCoins /> },
    { path: '/expenses', label: 'Expenses', icon: <FaMoneyBillWave /> },
    { path: '/recurring-expenses', label: 'Recurring Expenses', icon: <FaRedoAlt /> },
    { path: '/vaccinations', label: 'Vaccinations', icon: <FaSyringe /> },
    { path: '/calves', label: 'Calves', icon: <FaBaby /> },
    { path: '/reports', label: 'Reports', icon: <FaChartBar /> },
    { path: '/settings', label: 'Settings', icon: <FaCog /> }
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`sidebar bg-white shadow-sm border-end ${isCollapsed ? 'collapsed' : ''}`} style={{
      width: isCollapsed ? '70px' : '280px',
      minHeight: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000,
      transition: 'width 0.3s ease'
    }}>
      {/* Header */}
      <div className="sidebar-header p-3 border-bottom d-flex align-items-center justify-content-between">
        {!isCollapsed && (
          <Link to="/" className="d-flex align-items-center text-primary fw-bold text-decoration-none">
            <span className="me-2">🐄</span>
            <span className="d-none d-sm-inline">Dairy Farm Manager</span>
          </Link>
        )}
        <button
          className="btn btn-sm btn-outline-secondary border-0"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>

      {/* Currency Selector */}
      <div className="p-3 border-bottom">
        {isCollapsed ? (
          <div className="dropdown">
            <button
              className="btn btn-outline-secondary btn-sm w-100 d-flex justify-content-center"
              type="button"
              id="currencyDropdownCollapsed"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              title="Select Currency"
            >
              <FaCoins />
            </button>
            <ul className="dropdown-menu" aria-labelledby="currencyDropdownCollapsed">
              {currencies.map(currency => (
                <li key={currency.code}>
                  <button
                    className={`dropdown-item d-flex align-items-center ${
                      currency.code === preferredCurrency ? 'active' : ''
                    }`}
                    onClick={() => handleCurrencyChange(currency.code)}
                  >
                    <span className="me-2">{currency.symbol}</span>
                    {currency.name} ({currency.code})
                    {currency.isDefault && <span className="badge bg-primary ms-2">Default</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="dropdown">
            <button
              className="btn btn-outline-secondary dropdown-toggle w-100 d-flex align-items-center justify-content-between"
              type="button"
              id="currencyDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div className="d-flex align-items-center">
                <FaCoins className="me-2" />
                <span>{currencies.find(c => c.code === preferredCurrency)?.symbol || 'Rs '} {preferredCurrency}</span>
              </div>
            </button>
            <ul className="dropdown-menu w-100" aria-labelledby="currencyDropdown">
              {currencies.map(currency => (
                <li key={currency.code}>
                  <button
                    className={`dropdown-item d-flex align-items-center ${
                      currency.code === preferredCurrency ? 'active' : ''
                    }`}
                    onClick={() => handleCurrencyChange(currency.code)}
                  >
                    <span className="me-2">{currency.symbol}</span>
                    {currency.name} ({currency.code})
                    {currency.isDefault && <span className="badge bg-primary ms-2">Default</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav p-2">
        <ul className="list-unstyled">
          {navLinks.map(link => (
            <li key={link.path} className="mb-1">
              <Link
                to={link.path}
                className={`nav-link d-flex align-items-center px-3 py-2 rounded ${
                  location.pathname === link.path ? 'active bg-primary text-white' : 'text-muted'
                }`}
                title={isCollapsed ? link.label : ''}
              >
                <span className="me-3">{link.icon}</span>
                {!isCollapsed && <span>{link.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div className="sidebar-footer mt-auto p-3 border-top">
        {isCollapsed ? (
          <div className="dropdown">
            <button
              className="btn btn-outline-primary btn-sm w-100 d-flex justify-content-center"
              type="button"
              id="userDropdownCollapsed"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              title="User Menu"
            >
              <FaCog />
            </button>
            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdownCollapsed">
              <li>
                <h6 className="dropdown-header">{user?.name}</h6>
              </li>
              <li>
                <span className="dropdown-item-text small text-muted">{user?.email}</span>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item text-danger d-flex align-items-center" onClick={handleLogout}>
                  <FaSignOutAlt className="me-2" />
                  Logout
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <div className="dropdown">
            <button
              className="btn btn-outline-primary dropdown-toggle w-100 d-flex align-items-center"
              type="button"
              id="userDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <FaCog className="me-2" />
              <span className="text-truncate">{user?.farmName}</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end w-100" aria-labelledby="userDropdown">
              <li>
                <h6 className="dropdown-header">{user?.name}</h6>
              </li>
              <li>
                <span className="dropdown-item-text small text-muted">{user?.email}</span>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item text-danger d-flex align-items-center" onClick={handleLogout}>
                  <FaSignOutAlt className="me-2" />
                  Logout
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;