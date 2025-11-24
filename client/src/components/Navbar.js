import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaHome, FaTint, FaMoneyBillWave, FaSyringe, 
  FaBaby, FaChartBar, FaBars, FaTimes, FaSignOutAlt,
  FaFileContract, FaRedoAlt 
} from 'react-icons/fa';
import { GiCow } from 'react-icons/gi';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    { path: '/calves', label: 'Calves', icon: <FaBaby /> },
    { path: '/reports', label: 'Reports', icon: <FaChartBar /> }
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          🐄 Dairy Farm Manager
        </Link>

        <button 
          className="navbar-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <div className="navbar-links">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`navbar-link ${location.pathname === link.path ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="navbar-user">
            <span className="navbar-user-name">{user?.farmName}</span>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
