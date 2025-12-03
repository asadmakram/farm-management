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
      <div className="page-header-mobile">
        <h1 className="page-title">📋 Bandhi Contracts</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> <span className="btn-text">Add Contract</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid summary-grid-3 mb-3">
        <div className="summary-card">
          <h4>Active Contracts</h4>
          <p className="summary-value primary">{summary.active || 0}</p>
        </div>
        <div className="summary-card">
          <h4>Advance Held</h4>
          <p className="summary-value warning">Rs {(summary.totalAdvanceHeld || 0).toFixed(0)}</p>
        </div>
        <div className="summary-card">
          <h4>Advance Returned</h4>
          <p className="summary-value success">Rs {(summary.totalAdvanceReturned || 0).toFixed(0)}</p>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th className="hide-mobile">Start</th>
              <th className="hide-mobile">End</th>
              <th className="text-right">Rate</th>
              <th className="text-right">Advance</th>
              <th>Status</th>
              <th className="hide-tablet">Advance</th>
              <th style={{ width: '90px' }}></th>
            </tr>
          </thead>
          <tbody>
            {contracts.map(contract => (
              <tr key={contract._id}>
                <td data-label="Vendor"><strong>{contract.vendorName}</strong></td>
                <td data-label="Start" className="hide-mobile">{new Date(contract.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                <td data-label="End" className="hide-mobile">{new Date(contract.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                <td data-label="Rate" className="text-right">Rs {contract.ratePerLiter.toFixed(0)}</td>
                <td data-label="Advance" className="text-right">Rs {contract.advanceAmount.toFixed(0)}</td>
                <td data-label="Status">
                  <span className={`badge badge-${contract.status === 'active' ? 'success' : contract.status === 'completed' ? 'info' : 'danger'}`}>
                    {contract.status}
                  </span>
                </td>
                <td data-label="Advance Status" className="hide-tablet">
                  <span className={`badge badge-${contract.advanceStatus === 'held' ? 'warning' : 'success'}`}>
                    {contract.advanceStatus}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button 
                      className="btn-icon-only primary"
                      onClick={() => handleEdit(contract)}
                      title="Edit"
                    >
                      <FaEdit size={14} />
                    </button>
                    {contract.advanceStatus === 'held' && contract.status === 'active' && (
                      <button 
                        className="btn-icon-only"
                        style={{ color: '#10b981' }}
                        onClick={() => handleReturnAdvance(contract._id)}
                        title="Return Advance"
                      >
                        <FaCheckCircle size={14} />
                      </button>
                    )}
                    <button 
                      className="btn-icon-only danger"
                      onClick={() => handleDeleteClick(contract)}
                      title="Delete"
                    >
                      <FaTrash size={14} />
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
