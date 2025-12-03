import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaSync, FaCalendarAlt } from 'react-icons/fa';
import './PageStyles.css';

const EXPENSE_TYPES = [
  { value: 'master_b10_vanda', label: 'Master B-10 Vanda' },
  { value: 'mix_atti', label: 'Mix Atti' },
  { value: 'chaukar', label: 'Chaukar' },
  { value: 'tukra', label: 'Tukra' },
  { value: 'green_fodder', label: 'Green Fodder' },
  { value: 'worker_wage', label: 'Worker Wage' },
  { value: 'medical', label: 'Medical Expenses' },
  { value: 'rent', label: 'Rent' },
  { value: 'toori_wheat_straw', label: 'Toori (Wheat Straw)' }
];

function RecurringExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ totalActive: 0, estimatedMonthly: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    expenseType: 'master_b10_vanda',
    description: '',
    amount: '',
    frequency: '10_days',
    lastPurchaseDate: new Date().toISOString().split('T')[0],
    workerCount: 1,
    isActive: true,
    notes: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/recurring-expenses');
      setExpenses(response.data.expenses);
      setSummary(response.data.summary);
    } catch (error) {
      toast.error('Error fetching recurring expenses');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await api.put(`/api/recurring-expenses/${editingExpense._id}`, formData);
        toast.success('Expense updated successfully!');
      } else {
        await api.post('/recurring-expenses', formData);
        toast.success('Recurring expense added successfully!');
      }
      setShowModal(false);
      setEditingExpense(null);
      resetForm();
      fetchExpenses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving expense');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      expenseType: expense.expenseType,
      description: expense.description || '',
      amount: expense.amount,
      frequency: expense.frequency,
      lastPurchaseDate: new Date(expense.lastPurchaseDate).toISOString().split('T')[0],
      workerCount: expense.workerCount || 1,
      isActive: expense.isActive,
      notes: expense.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this recurring expense?')) {
      try {
        await api.delete(`/api/recurring-expenses/${id}`);
        toast.success('Expense deleted successfully!');
        fetchExpenses();
      } catch (error) {
        toast.error('Error deleting expense');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      expenseType: 'master_b10_vanda',
      description: '',
      amount: '',
      frequency: '10_days',
      lastPurchaseDate: new Date().toISOString().split('T')[0],
      workerCount: 1,
      isActive: true,
      notes: ''
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const getFrequencyLabel = (freq) => {
    switch(freq) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case '10_days': return 'Every 10 Days';
      case 'monthly': return 'Monthly';
      default: return freq;
    }
  };

  const calculateMonthlyAmount = (amount, frequency, workerCount = 1) => {
    const totalAmount = frequency === 'worker_wage' ? amount * workerCount : amount;
    switch(frequency) {
      case 'daily': return totalAmount * 30;
      case 'weekly': return totalAmount * 4;
      case '10_days': return totalAmount * 3;
      case 'monthly': return totalAmount;
      default: return 0;
    }
  };

  return (
    <div className="container mt-3">
      <div className="page-header-mobile">
        <h1 className="page-title"><FaSync /> Recurring Expenses</h1>
        <button className="btn btn-primary" onClick={() => {
          setEditingExpense(null);
          resetForm();
          setShowModal(true);
        }}>
          <FaPlus /> <span className="hide-mobile">Add</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'var(--primary-color)' }}>
            <FaSync />
          </div>
          <div className="summary-content">
            <span className="summary-label">Active Expenses</span>
            <span className="summary-value">{summary.totalActive}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'var(--success-color)' }}>
            <FaCalendarAlt />
          </div>
          <div className="summary-content">
            <span className="summary-label">Monthly Est.</span>
            <span className="summary-value">Rs {summary.estimatedMonthly.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Expense Type</th>
              <th className="hide-mobile">Amount</th>
              <th>Frequency</th>
              <th className="hide-tablet">Monthly Est.</th>
              <th className="hide-tablet">Next Purchase</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(expense => (
              <tr key={expense._id} className={!expense.isActive ? 'inactive' : ''}>
                <td>
                  <strong>{EXPENSE_TYPES.find(t => t.value === expense.expenseType)?.label || expense.expenseType}</strong>
                  {expense.expenseType === 'worker_wage' && expense.workerCount > 1 && (
                    <small style={{ display: 'block', color: 'var(--text-secondary)' }}>({expense.workerCount} workers)</small>
                  )}
                  <span className="show-mobile" style={{ display: 'none', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Rs {expense.amount.toLocaleString()}
                  </span>
                </td>
                <td className="hide-mobile">Rs {expense.amount.toLocaleString()}</td>
                <td>
                  <span className="badge badge-secondary">{getFrequencyLabel(expense.frequency)}</span>
                </td>
                <td className="hide-tablet">
                  <strong>Rs {calculateMonthlyAmount(expense.amount, expense.frequency, expense.workerCount).toLocaleString()}</strong>
                </td>
                <td className="hide-tablet">
                  {expense.nextPurchaseDate ? (
                    <span className={new Date(expense.nextPurchaseDate) < new Date() ? 'text-danger' : ''}>
                      {new Date(expense.nextPurchaseDate).toLocaleDateString()}
                    </span>
                  ) : '-'}
                </td>
                <td>
                  <span className={`badge ${expense.isActive ? 'badge-success' : 'badge-secondary'}`}>
                    {expense.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button 
                      className="btn-icon-only btn-primary" 
                      onClick={() => handleEdit(expense)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="btn-icon-only btn-danger" 
                      onClick={() => handleDelete(expense._id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {expenses.length === 0 && (
        <div className="empty-state">
          <FaSync size={48} />
          <p>No recurring expenses set up yet</p>
          <button className="btn btn-primary" onClick={() => {
            setEditingExpense(null);
            resetForm();
            setShowModal(true);
          }}>
            <FaPlus /> Add First Recurring Expense
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => {
          setShowModal(false);
          setEditingExpense(null);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingExpense ? 'Edit' : 'Add'} Recurring Expense</h2>
              <button className="modal-close" onClick={() => {
                setShowModal(false);
                setEditingExpense(null);
              }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Expense Type *</label>
                <select
                  className="form-select"
                  name="expenseType"
                  value={formData.expenseType}
                  onChange={handleChange}
                  required
                >
                  {EXPENSE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  className="form-input"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Additional details"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Frequency *</label>
                  <select
                    className="form-select"
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleChange}
                    required
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="10_days">Every 10 Days</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {formData.expenseType === 'worker_wage' && (
                <div className="form-group">
                  <label className="form-label">Number of Workers *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    name="workerCount"
                    value={formData.workerCount}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Last Purchase Date *</label>
                <input
                  type="date"
                  className="form-input"
                  name="lastPurchaseDate"
                  value={formData.lastPurchaseDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    style={{ width: 'auto' }}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="card" style={{ padding: '0.75rem', marginBottom: '1rem', background: 'var(--bg-light)' }}>
                <strong>Estimated Monthly Cost:</strong> Rs{' '}
                {calculateMonthlyAmount(
                  parseFloat(formData.amount || 0), 
                  formData.frequency,
                  parseInt(formData.workerCount || 1)
                ).toLocaleString()}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => {
                  setShowModal(false);
                  setEditingExpense(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingExpense ? 'Update' : 'Add'} Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecurringExpenses;
