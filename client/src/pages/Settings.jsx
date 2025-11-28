import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import { toast } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';

const Settings = () => {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    preferredCurrency: user?.preferredCurrency || 'INR',
    country: user?.country || '',
    city: user?.city || ''
  });
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const response = await api.get('/currencies');
      setCurrencies(response.data.currencies || []);
    } catch (error) {
      console.error('Error fetching currencies');
    }
  };

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
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h4 className="card-title mb-0">
                <i className="fas fa-cog me-2"></i>
                Settings
              </h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="preferredCurrency" className="form-label">
                      Preferred Currency
                    </label>
                    <select
                      className="form-select"
                      id="preferredCurrency"
                      name="preferredCurrency"
                      value={formData.preferredCurrency}
                      onChange={handleInputChange}
                    >
                      {currencies.map(currency => (
                        <option key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.name} ({currency.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="country" className="form-label">
                      Country
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="Enter your country"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="city" className="form-label">
                      City
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter your city"
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Updating...
                      </>
                    ) : (
                      'Update Settings'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;