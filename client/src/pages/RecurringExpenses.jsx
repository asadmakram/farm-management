import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
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
      case '10_days': return 'Every 10 Days';
      case 'monthly': return 'Monthly';
      default: return freq;
    }
  };

  const calculateMonthlyAmount = (amount, frequency, workerCount = 1) => {
    const totalAmount = frequency === 'worker_wage' ? amount * workerCount : amount;
    switch(frequency) {
      case 'daily': return totalAmount * 30;
      case '10_days': return totalAmount * 3;
      case 'monthly': return totalAmount;
      default: return 0;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🔄 Recurring Expenses</h1>
        <button className="btn-primary" onClick={() => {
          setEditingExpense(null);
          resetForm();
          setShowModal(true);
        }}>
          <FaPlus /> Add Recurring Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Active Expenses</h3>
          <p className="summary-value">{summary.totalActive}</p>
        </div>
        <div className="summary-card">
          <h3>Estimated Monthly Cost</h3>
          <p className="summary-value">Rs {summary.estimatedMonthly.toFixed(2)}</p>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Expense Type</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Frequency</th>
              <th>Monthly Est.</th>
              <th>Last Purchase</th>
              <th>Next Purchase</th>
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
                    <small> ({expense.workerCount} workers)</small>
                  )}
                </td>
                <td>{expense.description || '-'}</td>
                <td>Rs {expense.amount.toFixed(2)}</td>
                <td>
                  <span className="status-badge">{getFrequencyLabel(expense.frequency)}</span>
                </td>
                <td>
                  <strong>Rs {calculateMonthlyAmount(expense.amount, expense.frequency, expense.workerCount).toFixed(2)}</strong>
                </td>
                <td>{new Date(expense.lastPurchaseDate).toLocaleDateString()}</td>
                <td>
                  {expense.nextPurchaseDate ? (
                    <span className={new Date(expense.nextPurchaseDate) < new Date() ? 'text-danger' : ''}>
                      {new Date(expense.nextPurchaseDate).toLocaleDateString()}
                    </span>
                  ) : '-'}
                </td>
                <td>
                  <span className={`status-badge ${expense.isActive ? 'active' : 'inactive'}`}>
                    {expense.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn-icon" 
                    onClick={() => handleEdit(expense)}
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="btn-icon danger" 
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => {
          setShowModal(false);
          setEditingExpense(null);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingExpense ? 'Edit' : 'Add'} Recurring Expense</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Expense Type *</label>
                <select
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
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Additional details"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Frequency *</label>
                  <select
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleChange}
                    required
                  >
                    <option value="daily">Daily</option>
                    <option value="10_days">Every 10 Days</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {formData.expenseType === 'worker_wage' && (
                <div className="form-group">
                  <label>Number of Workers *</label>
                  <input
                    type="number"
                    min="1"
                    name="workerCount"
                    value={formData.workerCount}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Last Purchase Date *</label>
                <input
                  type="date"
                  name="lastPurchaseDate"
                  value={formData.lastPurchaseDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="info-box">
                <strong>Estimated Monthly Cost:</strong> Rs 
                {calculateMonthlyAmount(
                  parseFloat(formData.amount || 0), 
                  formData.frequency,
                  parseInt(formData.workerCount || 1)
                ).toFixed(2)}
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  {editingExpense ? 'Update' : 'Add'} Expense
                </button>
                <button type="button" className="btn-secondary" onClick={() => {
                  setShowModal(false);
                  setEditingExpense(null);
                }}>
                  Cancel
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
