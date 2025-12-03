import React, { useState, useEffect } from 'react';
import { FaPlus, FaMoneyBillWave, FaTrash, FaBox, FaSync, FaShoppingCart } from 'react-icons/fa';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './PageStyles.css';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'feed',
    expenseType: 'operating',
    amount: '',
    description: '',
    animalId: ''
  });
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/expenses');
      setExpenses(response.data.data);
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching expenses');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, amount: Number(formData.amount || 0) };
      if (!payload.animalId) {
        delete payload.animalId;
      }
      await api.post('/expenses', payload);
      toast.success('Expense added successfully');
      fetchExpenses();
      setShowModal(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: 'feed',
        expenseType: 'operating',
        amount: '',
        description: '',
        animalId: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving expense');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.delete(`/expenses/${id}`);
        toast.success('Expense deleted successfully');
        fetchExpenses();
      } catch (error) {
        toast.error('Error deleting expense');
      }
    }
  };

  if (loading) return <div className="container mt-3">Loading...</div>;

  const filteredExpenses = filterType === 'all' 
    ? expenses 
    : expenses.filter(e => e.expenseType === filterType);

  const assetTotal = expenses
    .filter(e => e.expenseType === 'asset')
    .reduce((sum, e) => sum + e.amount, 0);
  
  const operatingTotal = expenses
    .filter(e => e.expenseType === 'operating')
    .reduce((sum, e) => sum + e.amount, 0);

  const oneTimeTotal = expenses
    .filter(e => e.expenseType === 'one_time')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="container mt-3">
      <div className="page-header-mobile">
        <h1 className="page-title"><FaMoneyBillWave /> Expenses</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> <span className="hide-mobile">Add Expense</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'var(--primary-color)' }}>
            <FaBox />
          </div>
          <div className="summary-content">
            <span className="summary-label">Asset Expenses</span>
            <span className="summary-value">Rs {assetTotal.toLocaleString()}</span>
            <span className="summary-sub">Capital investments</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'var(--danger-color)' }}>
            <FaSync />
          </div>
          <div className="summary-content">
            <span className="summary-label">Operating Expenses</span>
            <span className="summary-value">Rs {operatingTotal.toLocaleString()}</span>
            <span className="summary-sub">Recurring costs</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'var(--warning-color)' }}>
            <FaShoppingCart />
          </div>
          <div className="summary-content">
            <span className="summary-label">One-time Expenses</span>
            <span className="summary-value">Rs {oneTimeTotal.toLocaleString()}</span>
            <span className="summary-sub">Single purchases</span>
          </div>
        </div>
      </div>

      {/* Total Card */}
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1rem', opacity: 0.9 }}>Total Expenses</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Rs {(assetTotal + operatingTotal + oneTimeTotal).toLocaleString()}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filters-section">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All
          </button>
          <button 
            className={`filter-tab ${filterType === 'asset' ? 'active' : ''}`}
            onClick={() => setFilterType('asset')}
          >
            <FaBox className="hide-mobile" /> Asset
          </button>
          <button 
            className={`filter-tab ${filterType === 'operating' ? 'active' : ''}`}
            onClick={() => setFilterType('operating')}
          >
            <FaSync className="hide-mobile" /> Operating
          </button>
          <button 
            className={`filter-tab ${filterType === 'one_time' ? 'active' : ''}`}
            onClick={() => setFilterType('one_time')}
          >
            <FaShoppingCart className="hide-mobile" /> One-time
          </button>
        </div>
      </div>

      {filteredExpenses.length > 0 ? (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th className="hide-mobile">Category</th>
                <th className="hide-tablet">Description</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(expense => (
                <tr key={expense._id}>
                  <td>{new Date(expense.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${
                      expense.expenseType === 'asset' ? 'badge-primary' : 
                      expense.expenseType === 'operating' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {expense.expenseType === 'asset' ? '💎' : expense.expenseType === 'operating' ? '🔄' : '🛒'}
                      <span className="hide-mobile"> {expense.expenseType.replace('_', '-')}</span>
                    </span>
                  </td>
                  <td className="hide-mobile">
                    <span className="badge badge-secondary">{expense.category.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="hide-tablet">{expense.description || '-'}</td>
                  <td><strong>Rs {expense.amount.toLocaleString()}</strong></td>
                  <td>
                    <button 
                      className="btn-icon-only btn-danger"
                      onClick={() => handleDelete(expense._id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <FaMoneyBillWave size={48} />
          <p>No expenses recorded yet</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FaPlus /> Add First Expense
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Expense</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Expense Type *</label>
                <select
                  className="form-select"
                  value={formData.expenseType}
                  onChange={e => setFormData({...formData, expenseType: e.target.value})}
                  required
                >
                  <option value="operating">🔄 Operating Expense (Recurring)</option>
                  <option value="one_time">🛒 One-time Expense</option>
                  <option value="asset">💎 Asset Purchase (Capital)</option>
                </select>
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  {formData.expenseType === 'asset' 
                    ? '💎 Capital investment to increase farm assets' 
                    : formData.expenseType === 'operating'
                    ? '🔄 Regular operational costs (feed, labour, etc.)'
                    : '🛒 Single purchase that won\'t repeat'}
                </small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    {formData.expenseType === 'asset' ? (
                      <>
                        <option value="animal_purchase">Animal Purchase</option>
                        <option value="equipment_purchase">Equipment Purchase</option>
                        <option value="land_improvement">Land Improvement</option>
                        <option value="building_construction">Building Construction</option>
                      </>
                    ) : (
                      <>
                        <option value="feed">Feed (Vanda)</option>
                        <option value="labour">Labour</option>
                        <option value="rental">Rental</option>
                        <option value="veterinary">Veterinary</option>
                        <option value="medicine">Medicine</option>
                        <option value="utilities">Utilities</option>
                        <option value="transportation">Transportation</option>
                        <option value="utensils">Utensils</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="insurance">Insurance</option>
                        <option value="other">Other</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (Rs) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Add notes about this expense..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
