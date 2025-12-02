import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTranslation } from 'react-i18next';
import { 
  FaHome, FaTint, FaMoneyBillWave, FaSyringe, 
  FaBaby, FaChartBar, FaBars, FaTimes, FaSignOutAlt,
  FaFileContract, FaRedoAlt, FaCoins, FaCog, FaGlobe
} from 'react-icons/fa';
import { GiCow } from 'react-icons/gi';
import 'bootstrap/dist/css/bootstrap.min.css';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [preferredCurrency, setPreferredCurrency] = useState(user?.preferredCurrency || 'INR');

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrencies();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Prevent body scroll when mobile menu is open
    if (isMenuOpen && window.innerWidth < 992) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

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
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm border-bottom">
        <div className="container-fluid">
          <Link to="/" className="navbar-brand d-flex align-items-center text-primary fw-bold">
            <span className="me-2">🐄</span>
            <span className="d-none d-sm-inline">Dairy Farm Manager</span>
            <span className="d-inline d-sm-none">DFM</span>
          </Link>

          <button 
            className="navbar-toggler border-0"
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-controls="navbarNav"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation"
          >
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>

          <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
            {/* Language Selector */}
            <div className="d-flex align-items-center me-3 mt-3 mt-lg-0">
              <div className="dropdown w-100">
                <button 
                  className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center justify-content-between w-100"
                  type="button"
                  id="languageDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center">
                    <FaGlobe className="me-2" />
                    {i18n.language === 'ur' ? 'اردو' : 'English'}
                  </span>
                </button>
                <ul className="dropdown-menu w-100" aria-labelledby="languageDropdown">
                  <li>
                    <button className="dropdown-item" onClick={() => { changeLanguage('en'); setIsMenuOpen(false); }}>English</button>
                  </li>
                  <li>
                    <button className="dropdown-item" onClick={() => { changeLanguage('ur'); setIsMenuOpen(false); }}>اردو</button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Currency Selector */}
            <div className="d-flex align-items-center me-3 mt-2 mt-lg-0">
              <div className="dropdown w-100">
                <button 
                  className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center justify-content-between w-100"
                  type="button"
                  id="currencyDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center">
                    <FaCoins className="me-2" />
                    {currencies.find(c => c.code === preferredCurrency)?.symbol || '₹'} {preferredCurrency}
                  </span>
                </button>
                <ul className="dropdown-menu w-100" aria-labelledby="currencyDropdown">
                  {currencies.map(currency => (
                    <li key={currency.code}>
                      <button 
                        className={`dropdown-item d-flex align-items-center ${
                          currency.code === preferredCurrency ? 'active' : ''
                        }`}
                        onClick={() => { handleCurrencyChange(currency.code); setIsMenuOpen(false); }}
                      >
                        <span className="me-2">{currency.symbol}</span>
                        {currency.name} ({currency.code})
                        {currency.isDefault && <span className="badge bg-primary ms-2">Default</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <ul className="navbar-nav mb-2 mb-lg-0 mt-3 mt-lg-0">
              {navLinks.map(link => (
                <li className="nav-item" key={link.path}>
                  <Link
                    to={link.path}
                    className={`nav-link d-flex align-items-center px-3 py-2 mx-1 rounded ${
                      location.pathname === link.path ? 'active bg-primary text-white' : 'text-muted'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.icon}
                    <span className="ms-2">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="d-flex align-items-center mt-3 mt-lg-0">
              {/* User Info */}
              <div className="dropdown w-100">
                <button 
                  className="btn btn-outline-primary dropdown-toggle d-flex align-items-center justify-content-between w-100"
                  type="button"
                  id="userDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="d-flex align-items-center">
                    <FaCog className="me-2" />
                    <span className="d-none d-md-inline">{user?.farmName}</span>
                    <span className="d-inline d-md-none">{user?.name}</span>
                  </span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end w-100" aria-labelledby="userDropdown">
                  <li>
                    <h6 className="dropdown-header">{user?.name}</h6>
                  </li>
                  <li>
                    <span className="dropdown-item-text small text-muted">{user?.email}</span>
                  </li>
                  <li>
                    <span className="dropdown-item-text small text-muted">{user?.farmName}</span>
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
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile Menu Backdrop */}
      {isMenuOpen && (
        <div 
          className="mobile-backdrop"
          onClick={() => setIsMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            display: window.innerWidth < 992 ? 'block' : 'none'
          }}
        />
      )}
    </>
  );
};

export default Navbar;
