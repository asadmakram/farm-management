import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import { toast } from 'react-toastify';
import { FaCog, FaCalendarAlt, FaMapMarkerAlt, FaCity } from 'react-icons/fa';
import './PageStyles.css';

const Settings = () => {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    businessStartDate: user?.businessStartDate ? new Date(user.businessStartDate).toISOString().split('T')[0] : '',
    country: user?.country || '',
    city: user?.city || ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put('/auth/settings', formData);
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Error updating settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-3">
      <div className="page-header-mobile">
        <h1 className="page-title"><FaCog /> Settings</h1>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card-header" style={{ 
          background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '12px 12px 0 0'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
            <FaCog style={{ marginRight: '0.5rem' }} />
            Farm Settings
          </h3>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaCalendarAlt style={{ color: 'var(--primary-color)' }} />
                Business Start Date
              </label>
              <input
                type="date"
                className="form-input"
                name="businessStartDate"
                value={formData.businessStartDate}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              />
              <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                Set this date to calculate recurring expenses only from when your business actually started.
                This helps get accurate expense reports.
              </small>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaMapMarkerAlt style={{ color: 'var(--success-color)' }} />
                Country
              </label>
              <input
                type="text"
                className="form-input"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                placeholder="Enter your country"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaCity style={{ color: 'var(--warning-color)' }} />
                City
              </label>
              <input
                type="text"
                className="form-input"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Enter your city"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', fontWeight: '600' }}
            >
              {loading ? 'Updating...' : 'Update Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;