import React, { useState, useEffect } from 'react';
import { FaPlus, FaMoneyBillWave } from 'react-icons/fa';
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

  return (
    <div className="container mt-3">
      <div className="flex-between mb-3">
        <h1 className="page-title"><FaMoneyBillWave /> Expenses</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-3 mb-3">
        <div className="card" style={{ padding: '1rem' }}>
          <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Asset Expenses</h4>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
            ₹{assetTotal.toFixed(2)}
          </p>
          <small style={{ color: 'var(--text-secondary)' }}>Capital investments</small>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Operating Expenses</h4>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger-color)' }}>
            ₹{operatingTotal.toFixed(2)}
          </p>
          <small style={{ color: 'var(--text-secondary)' }}>Monthly/recurring costs</small>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Expenses</h4>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            ₹{(assetTotal + operatingTotal).toFixed(2)}
          </p>
          <small style={{ color: 'var(--text-secondary)' }}>All categories</small>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-section">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button 
            className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilterType('all')}
          >
            All Expenses
          </button>
          <button 
            className={`btn ${filterType === 'asset' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilterType('asset')}
          >
            Asset Expenses
          </button>
          <button 
            className={`btn ${filterType === 'operating' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilterType('operating')}
          >
            Operating Expenses
          </button>
        </div>
      </div>

      {filteredExpenses.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(expense => (
                <tr key={expense._id}>
                  <td>{new Date(expense.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${expense.expenseType}`}>
                      {expense.expenseType === 'asset' ? '💎 Asset' : '🔄 Operating'}
                    </span>
                  </td>
                  <td><span className="status-badge">{expense.category.replace(/_/g, ' ')}</span></td>
                  <td>{expense.description || 'N/A'}</td>
                  <td><strong>₹{expense.amount.toFixed(2)}</strong></td>
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
                  <option value="operating">Operating Expense (Monthly/Recurring)</option>
                  <option value="asset">Asset Expense (Capital Investment)</option>
                </select>
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  {formData.expenseType === 'asset' 
                    ? '💎 Capital investment to increase assets' 
                    : '🔄 Regular operational costs'}
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
                  <label className="form-label">Amount (₹) *</label>
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
