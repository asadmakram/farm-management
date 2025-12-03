import React, { useState, useEffect } from 'react';
import { FaPlus, FaSyringe, FaCalendarCheck, FaMoneyBillWave, FaTrash } from 'react-icons/fa';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './PageStyles.css';

const Vaccinations = () => {
  const [vaccinations, setVaccinations] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    animalId: '',
    vaccineName: '',
    dateAdministered: new Date().toISOString().split('T')[0],
    nextDueDate: '',
    veterinarian: '',
    cost: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vaccRes, animalsRes] = await Promise.all([
        api.get('/vaccinations'),
        api.get('/animals')
      ]);
      setVaccinations(vaccRes.data.data);
      setAnimals(animalsRes.data.data.filter(a => a.status === 'active'));
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching data');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/vaccinations', { ...formData, cost: Number(formData.cost || 0) });
      toast.success('Vaccination record added successfully');
      fetchData();
      setShowModal(false);
      setFormData({
        animalId: '',
        vaccineName: '',
        dateAdministered: new Date().toISOString().split('T')[0],
        nextDueDate: '',
        veterinarian: '',
        cost: '',
        notes: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving vaccination');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vaccination record?')) {
      try {
        await api.delete(`/vaccinations/${id}`);
        toast.success('Vaccination record deleted');
        fetchData();
      } catch (error) {
        toast.error('Error deleting vaccination');
      }
    }
  };

  if (loading) return <div className="container mt-3">Loading...</div>;

  const totalCost = vaccinations.reduce((sum, v) => sum + (v.cost || 0), 0);
  const upcomingDue = vaccinations.filter(v => v.nextDueDate && new Date(v.nextDueDate) > new Date() && new Date(v.nextDueDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length;

  return (
    <div className="container mt-3">
      <div className="page-header-mobile">
        <h1 className="page-title"><FaSyringe /> Vaccinations</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> <span className="hide-mobile">Add</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'var(--primary-color)' }}>
            <FaSyringe />
          </div>
          <div className="summary-content">
            <span className="summary-label">Total Records</span>
            <span className="summary-value">{vaccinations.length}</span>
            <span className="summary-sub">All vaccinations</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'var(--warning-color)' }}>
            <FaCalendarCheck />
          </div>
          <div className="summary-content">
            <span className="summary-label">Due Soon</span>
            <span className="summary-value">{upcomingDue}</span>
            <span className="summary-sub">Next 30 days</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'var(--danger-color)' }}>
            <FaMoneyBillWave />
          </div>
          <div className="summary-content">
            <span className="summary-label">Total Cost</span>
            <span className="summary-value">Rs {totalCost.toLocaleString()}</span>
            <span className="summary-sub">All time</span>
          </div>
        </div>
      </div>

      {vaccinations.length > 0 ? (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Animal</th>
                <th>Vaccine</th>
                <th className="hide-mobile">Date</th>
                <th className="hide-tablet">Next Due</th>
                <th className="hide-tablet">Vet</th>
                <th>Cost</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {vaccinations.map(vacc => (
                <tr key={vacc._id}>
                  <td><strong>{vacc.animalId?.tagNumber || 'N/A'}</strong></td>
                  <td>{vacc.vaccineName}</td>
                  <td className="hide-mobile">{new Date(vacc.dateAdministered).toLocaleDateString()}</td>
                  <td className="hide-tablet">
                    {vacc.nextDueDate ? (
                      <span className={new Date(vacc.nextDueDate) < new Date() ? 'text-danger' : ''}>
                        {new Date(vacc.nextDueDate).toLocaleDateString()}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="hide-tablet">{vacc.veterinarian || '-'}</td>
                  <td>Rs {Number(vacc.cost || 0).toLocaleString()}</td>
                  <td>
                    <button 
                      className="btn-icon-only btn-danger"
                      onClick={() => handleDelete(vacc._id)}
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
          <FaSyringe size={48} />
          <p>No vaccination records yet</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FaPlus /> Add First Vaccination
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Vaccination Record</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Animal *</label>
                <select
                  className="form-select"
                  value={formData.animalId}
                  onChange={e => setFormData({...formData, animalId: e.target.value})}
                  required
                >
                  <option value="">Select Animal</option>
                  {animals.map(animal => (
                    <option key={animal._id} value={animal._id}>
                      {animal.tagNumber} - {animal.name || animal.breed}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Vaccine Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.vaccineName}
                  onChange={e => setFormData({...formData, vaccineName: e.target.value})}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date Administered *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.dateAdministered}
                    onChange={e => setFormData({...formData, dateAdministered: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Next Due Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.nextDueDate}
                    onChange={e => setFormData({...formData, nextDueDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Veterinarian</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.veterinarian}
                    onChange={e => setFormData({...formData, veterinarian: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.cost}
                    onChange={e => setFormData({...formData, cost: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Vaccination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vaccinations;
