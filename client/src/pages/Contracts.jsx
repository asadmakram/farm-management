import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaCheckCircle, FaTrash } from 'react-icons/fa';
import './PageStyles.css';

function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [summary, setSummary] = useState({ active: 0, totalAdvanceHeld: 0, totalAdvanceReturned: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contractToDelete, setContractToDelete] = useState(null);
  const [formData, setFormData] = useState({
    vendorName: '',
    startDate: '',
    endDate: '',
    ratePerLiter: 182.5,
    advanceAmount: '',
    notes: ''
  });

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await api.get('/contracts');
      setContracts(response.data.contracts || []);
      setSummary(response.data.summary || { active: 0, totalAdvanceHeld: 0, totalAdvanceReturned: 0 });
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching contracts');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingContract) {
        await api.put(`/contracts/${editingContract._id}`, formData);
        toast.success('Contract updated successfully!');
      } else {
        await api.post('/contracts', formData);
        toast.success('Contract created successfully!');
      }
      setShowModal(false);
      setEditingContract(null);
      setFormData({
        vendorName: '',
        startDate: '',
        endDate: '',
        ratePerLiter: 182.5,
        advanceAmount: '',
        notes: ''
      });
      fetchContracts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving contract');
    }
  };

  const handleEdit = (contract) => {
    setEditingContract(contract);
    setFormData({
      vendorName: contract.vendorName,
      startDate: contract.startDate.split('T')[0],
      endDate: contract.endDate.split('T')[0],
      ratePerLiter: contract.ratePerLiter,
      advanceAmount: contract.advanceAmount,
      notes: contract.notes || ''
    });
    setShowModal(true);
  };

  const handleDeleteClick = (contract) => {
    setContractToDelete(contract);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contractToDelete) return;
    try {
      await api.delete(`/contracts/${contractToDelete._id}`);
      toast.success('Contract deleted successfully!');
      setShowDeleteConfirm(false);
      setContractToDelete(null);
      fetchContracts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting contract');
    }
  };

  const handleReturnAdvance = async (contractId) => {
    if (window.confirm('Are you sure you want to mark this advance as returned and complete the contract?')) {
      try {
        await api.patch(`/api/contracts/${contractId}/return-advance`);
        toast.success('Advance returned successfully!');
        fetchContracts();
      } catch (error) {
        toast.error('Error returning advance');
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="container mt-3">Loading...</div>;

  return (
    <div className="container mt-3">
      <div className="flex-between mb-3">
        <h1 className="page-title">📋 Bandhi Contracts</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add Contract
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-3 mb-3">
        <div className="card" style={{ padding: '1rem' }}>
          <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Active Contracts</h4>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
            {summary.active || 0}
          </p>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Advance Held</h4>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning-color)' }}>
            Rs {(summary.totalAdvanceHeld || 0).toFixed(2)}
          </p>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Advance Returned</h4>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
            Rs {(summary.totalAdvanceReturned || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Vendor Name</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Rate/Liter</th>
              <th>Advance Amount</th>
              <th>Status</th>
              <th>Advance Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map(contract => (
              <tr key={contract._id}>
                <td><strong>{contract.vendorName}</strong></td>
                <td>{new Date(contract.startDate).toLocaleDateString()}</td>
                <td>{new Date(contract.endDate).toLocaleDateString()}</td>
                <td>Rs {contract.ratePerLiter.toFixed(2)}</td>
                <td>Rs {contract.advanceAmount.toFixed(2)}</td>
                <td>
                  <span className={`status-badge ${contract.status}`}>
                    {contract.status}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${contract.advanceStatus}`}>
                    {contract.advanceStatus}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button 
                      className="btn btn-sm btn-outline"
                      style={{ color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}
                      onClick={() => handleEdit(contract)}
                      title="Edit Contract"
                    >
                      <FaEdit />
                    </button>
                    {contract.advanceStatus === 'held' && contract.status === 'active' && (
                      <button 
                        className="btn btn-sm btn-outline"
                        style={{ color: 'var(--success-color)', borderColor: 'var(--success-color)' }}
                        onClick={() => handleReturnAdvance(contract._id)}
                        title="Return Advance & Complete Contract"
                      >
                        <FaCheckCircle />
                      </button>
                    )}
                    <button 
                      className="btn btn-sm btn-outline"
                      style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                      onClick={() => handleDeleteClick(contract)}
                      title="Delete Contract"
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingContract(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingContract ? 'Edit Contract' : 'New Bandhi Contract'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Vendor Name *</label>
                  <input
                    type="text"
                    name="vendorName"
                    value={formData.vendorName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Rate per Liter *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="ratePerLiter"
                    value={formData.ratePerLiter}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Advance Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="advanceAmount"
                    value={formData.advanceAmount}
                    onChange={handleChange}
                    required
                  />
                </div>
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

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => { setShowModal(false); setEditingContract(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingContract ? 'Update Contract' : 'Create Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h2 style={{ color: 'var(--danger-color)' }}>⚠️ Confirm Delete</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Are you sure you want to delete the contract with <strong>{contractToDelete?.vendorName}</strong>?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => { setShowDeleteConfirm(false); setContractToDelete(null); }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn" 
                style={{ backgroundColor: 'var(--danger-color)', color: 'white' }}
                onClick={handleDeleteConfirm}
              >
                Delete Contract
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Contracts;
