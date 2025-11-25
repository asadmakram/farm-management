import React, { useState, useEffect } from 'react';
import { FaPlus, FaCoins, FaEdit, FaTrash } from 'react-icons/fa';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './PageStyles.css';

const Currencies = () => {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    exchangeRate: '',
    isDefault: false
  });

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const response = await api.get('/currencies');
      setCurrencies(response.data.currencies || []);
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching currencies');
      setCurrencies([]);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase(),
        exchangeRate: Number(formData.exchangeRate)
      };

      if (editingCurrency) {
        await api.put(`/currencies/${editingCurrency._id}`, payload);
        toast.success('Currency updated successfully');
      } else {
        await api.post('/currencies', payload);
        toast.success('Currency created successfully');
      }

      fetchCurrencies();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving currency');
    }
  };

  const handleEdit = (currency) => {
    setEditingCurrency(currency);
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      exchangeRate: currency.exchangeRate.toString(),
      isDefault: currency.isDefault
    });
    setShowModal(true);
  };

  const handleDelete = async (currency) => {
    if (!window.confirm(`Are you sure you want to delete ${currency.name}?`)) {
      return;
    }

    try {
      await api.delete(`/currencies/${currency._id}`);
      toast.success('Currency deleted successfully');
      fetchCurrencies();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting currency');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      symbol: '',
      exchangeRate: '',
      isDefault: false
    });
    setEditingCurrency(null);
  };

  const initializeCurrencies = async () => {
    try {
      await api.post('/currencies/initialize');
      toast.success('Default currencies initialized');
      fetchCurrencies();
    } catch (error) {
      toast.error('Error initializing currencies');
    }
  };

  if (loading) return <div className="container mt-3">Loading...</div>;

  return (
    <div className="container mt-3">
      <div className="flex-between mb-3">
        <h1 className="page-title"><FaCoins /> Currency Management</h1>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={initializeCurrencies}>
            Initialize Default Currencies
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FaPlus /> Add Currency
          </button>
        </div>
      </div>

      {/* Currencies Table */}
      {currencies.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th className="text-left">Code</th>
                <th className="text-left">Name</th>
                <th className="text-center">Symbol</th>
                <th className="text-right">Exchange Rate</th>
                <th className="text-center">Default</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currencies.map(currency => (
                <tr key={currency._id}>
                  <td data-label="Code" className="text-left">
                    <strong>{currency.code}</strong>
                  </td>
                  <td data-label="Name" className="text-left">{currency.name}</td>
                  <td data-label="Symbol" className="text-center">
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{currency.symbol}</span>
                  </td>
                  <td data-label="Exchange Rate" className="text-right">
                    1 {currency.code} = {currency.exchangeRate} INR
                  </td>
                  <td data-label="Default" className="text-center">
                    {currency.isDefault && (
                      <span className="status-badge" style={{ background: '#d1fae5', color: '#065f46' }}>
                        Default
                      </span>
                    )}
                  </td>
                  <td data-label="Actions" className="text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        className="btn-icon"
                        onClick={() => handleEdit(currency)}
                        title="Edit currency"
                      >
                        <FaEdit />
                      </button>
                      {!currency.isDefault && (
                        <button
                          className="btn-icon danger"
                          onClick={() => handleDelete(currency)}
                          title="Delete currency"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <FaCoins size={48} />
          <p>No currencies configured yet</p>
          <button className="btn btn-primary" onClick={initializeCurrencies}>
            Initialize Default Currencies
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCurrency ? 'Edit Currency' : 'Add New Currency'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <div className="form-section-title">
                  <span>💱</span>
                  <span>Currency Details</span>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Currency Code *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.code}
                      onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="USD"
                      maxLength="3"
                      required
                      disabled={!!editingCurrency}
                    />
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      3-letter currency code (ISO 4217)
                    </small>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Currency Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="US Dollar"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Symbol *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.symbol}
                      onChange={e => setFormData({...formData, symbol: e.target.value})}
                      placeholder="$"
                      maxLength="5"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Exchange Rate (to INR) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.exchangeRate}
                      onChange={e => setFormData({...formData, exchangeRate: e.target.value})}
                      placeholder="83.50"
                      min="0"
                      step="0.01"
                      required
                    />
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      1 {formData.code || 'CUR'} = {formData.exchangeRate || 'X'} INR
                    </small>
                  </div>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={e => setFormData({...formData, isDefault: e.target.checked})}
                    />
                    Set as default currency
                  </label>
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                    Only one currency can be default at a time
                  </small>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCurrency ? 'Update Currency' : 'Create Currency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Currencies;