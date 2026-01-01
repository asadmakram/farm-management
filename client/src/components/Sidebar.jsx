import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  FaHome, FaTint, FaMoneyBillWave, FaSyringe,
  FaBaby, FaChartBar, FaSignOutAlt,
  FaFileContract, FaRedoAlt, FaCog, FaChevronLeft, FaChevronRight, FaTimes, FaBars, FaBell
} from 'react-icons/fa';
import { GiCow } from 'react-icons/gi';
import NotificationBell from './NotificationBell.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Sidebar.css';

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: <FaHome /> },
    { path: '/animals', label: 'Animals', icon: <GiCow /> },
    { path: '/milk/production', label: 'Milk Production', icon: <FaTint /> },
    { path: '/milk/sales', label: 'Milk Sales', icon: <FaMoneyBillWave /> },
    { path: '/contracts', label: 'Contracts', icon: <FaFileContract /> },
    { path: '/expenses', label: 'Expenses', icon: <FaMoneyBillWave /> },
    { path: '/recurring-expenses', label: 'Recurring Expenses', icon: <FaRedoAlt /> },
    { path: '/vaccinations', label: 'Vaccinations', icon: <FaSyringe /> },
    { path: '/reminders', label: 'Reminders', icon: <FaBell /> },
    { path: '/calves', label: 'Calves', icon: <FaBaby /> },
    { path: '/reports', label: 'Reports', icon: <FaChartBar /> },
    { path: '/feed-calculations', label: 'Feed Calculations', icon: <FaChartBar /> },
    { path: '/feed-orders', label: 'Feed Orders', icon: <FaMoneyBillWave /> },
    { path: '/settings', label: 'Settings', icon: <FaCog /> }
  ];

  if (!isAuthenticated) {
    return null;
  }

  const handleLinkClick = () => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Header Bar - Fixed at top */}
      {isMobile && (
        <div className="mobile-header-bar">
          <button
            className="mobile-hamburger-btn"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle menu"
          >
            {isMobileOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
          <Link to="/" className="mobile-brand" onClick={handleLinkClick}>
            <span className="brand-icon">🐄</span>
            <span className="brand-text">Dairy Farm Manager</span>
          </Link>
        </div>
      )}

      {/* Mobile Backdrop */}
      {isMobile && isMobileOpen && (
        <div 
          className="mobile-sidebar-backdrop"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div className={`sidebar bg-white shadow-sm border-end ${isCollapsed ? 'collapsed' : ''} ${isMobile ? (isMobileOpen ? 'mobile-open' : 'mobile-closed') : ''}`} style={{
        width: isMobile ? '280px' : (isCollapsed ? '70px' : '260px'),
        minHeight: isMobile ? 'calc(100vh - 56px)' : '100vh',
        position: 'fixed',
        left: 0,
        top: isMobile ? '56px' : 0,
        zIndex: 1040,
        transition: 'all 0.3s ease',
        transform: isMobile ? (isMobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        display: 'flex',
        flexDirection: 'column'
      }}>
      {/* Header - Desktop Only */}
      {!isMobile && (
        <div className="sidebar-header p-3 border-bottom d-flex align-items-center justify-content-between">
          {!isCollapsed && (
            <Link to="/" className="d-flex align-items-center text-primary fw-bold text-decoration-none" onClick={handleLinkClick}>
              <span className="me-2">🐄</span>
              <span>Dairy Farm Manager</span>
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
      )}

      {/* Navigation Links */}
      <nav className="sidebar-nav p-2 flex-grow-1 overflow-auto">
        {/* Notification Bell */}
        <div className="notification-bell-container mb-2">
          <NotificationBell />
        </div>

        <ul className="list-unstyled">
          {navLinks.map(link => (
            <li key={link.path} className="mb-1">
              <Link
                to={link.path}
                className={`nav-link d-flex align-items-center px-3 py-2 rounded ${
                  location.pathname === link.path ? 'active bg-primary text-white' : 'text-muted'
                }`}
                title={isCollapsed && !isMobile ? link.label : ''}
                onClick={handleLinkClick}
              >
                <span className="nav-icon me-3">{link.icon}</span>
                {(!isCollapsed || isMobile) && <span>{link.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info & Logout - Always visible at bottom */}
      <div className="sidebar-footer p-3 border-top">
        <div className="user-info mb-2">
          {(!isCollapsed || isMobile) && (
            <>
              <div className="user-name fw-bold text-dark small">{user?.name}</div>
              <div className="farm-name text-muted" style={{ fontSize: '0.75rem' }}>{user?.farmName}</div>
            </>
          )}
        </div>
        <button
          className={`btn btn-danger w-100 d-flex align-items-center ${isCollapsed && !isMobile ? 'justify-content-center' : ''}`}
          onClick={handleLogout}
        >
          <FaSignOutAlt className={(!isCollapsed || isMobile) ? 'me-2' : ''} />
          {(!isCollapsed || isMobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;