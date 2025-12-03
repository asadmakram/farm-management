import React, { useState, useEffect } from 'react';
import { FaBaby, FaPlus, FaEdit, FaTrash, FaMars, FaVenus, FaWeight } from 'react-icons/fa';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './PageStyles.css';

const Calves = () => {
  const [calves, setCalves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCalf, setEditingCalf] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [formData, setFormData] = useState({
    animalId: '',
    motherId: '',
    birthDate: new Date().toISOString().split('T')[0],
    birthWeight: '',
    gender: 'female',
    notes: ''
  });

  useEffect(() => {
    fetchCalves();
    fetchAnimals();
  }, []);

  const fetchCalves = async () => {
    try {
      const response = await api.get('/calves');
      setCalves(response.data.data);
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching calves');
      setLoading(false);
    }
  };

  const fetchAnimals = async () => {
    try {
      const response = await api.get('/animals');
      setAnimals(response.data.data || []);
    } catch (error) {
      toast.error('Error fetching animals');
    }
  };

  const openModal = (calf = null) => {
    if (calf) {
      setEditingCalf(calf);
      setFormData({
        animalId: calf.animalId?._id || '',
        motherId: calf.motherId?._id || '',
        birthDate: calf.birthDate.split('T')[0],
        birthWeight: calf.birthWeight,
        gender: calf.gender,
        notes: calf.notes || ''
      });
    } else {
      setEditingCalf(null);
      setFormData({
        animalId: '',
        motherId: '',
        birthDate: new Date().toISOString().split('T')[0],
        birthWeight: '',
        gender: 'female',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCalf(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCalf) {
        await api.put(`/calves/${editingCalf._id}`, { ...formData, birthWeight: Number(formData.birthWeight || 0) });
        toast.success('Calf updated successfully');
      } else {
        await api.post('/calves', { ...formData, birthWeight: Number(formData.birthWeight || 0) });
        toast.success('Calf added successfully');
      }
      fetchCalves();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving calf');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this calf?')) {
      try {
        await api.delete(`/calves/${id}`);
        toast.success('Calf deleted successfully');
        fetchCalves();
      } catch (error) {
        toast.error('Error deleting calf');
      }
    }
  };

  if (loading) return <div className="container mt-3">Loading...</div>;

  const maleCount = calves.filter(c => c.gender === 'male').length;
  const femaleCount = calves.filter(c => c.gender === 'female').length;
  const avgWeight = calves.length > 0 ? calves.reduce((sum, c) => sum + (c.birthWeight || 0), 0) / calves.length : 0;

  return (
    <div className="container mt-3">
      <div className="page-header-mobile">
        <h1 className="page-title"><FaBaby /> Calves</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <FaPlus /> <span className="hide-mobile">Add Calf</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'var(--primary-color)' }}>
            <FaBaby />
          </div>
          <div className="summary-content">
            <span className="summary-label">Total Calves</span>
            <span className="summary-value">{calves.length}</span>
            <span className="summary-sub">All recorded</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: '#5b9bd5' }}>
            <FaMars />
          </div>
          <div className="summary-content">
            <span className="summary-label">Male</span>
            <span className="summary-value">{maleCount}</span>
            <span className="summary-sub">Bull calves</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: '#e91e8c' }}>
            <FaVenus />
          </div>
          <div className="summary-content">
            <span className="summary-label">Female</span>
            <span className="summary-value">{femaleCount}</span>
            <span className="summary-sub">Heifer calves</span>
          </div>
        </div>
      </div>

      {/* Avg Weight Card */}
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1rem', opacity: 0.9 }}>Average Birth Weight</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{avgWeight.toFixed(1)} kg</span>
        </div>
      </div>

      {calves.length > 0 ? (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Calf Tag</th>
                <th className="hide-mobile">Mother</th>
                <th>Gender</th>
                <th className="hide-tablet">Birth Date</th>
                <th className="hide-tablet">Weight</th>
                <th>Age</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {calves.map(calf => (
                <tr key={calf._id}>
                  <td><strong>{calf.animalId?.tagNumber || 'N/A'}</strong></td>
                  <td className="hide-mobile">{calf.motherId?.tagNumber || 'N/A'}</td>
                  <td>
                    <span className={`badge ${calf.gender === 'male' ? 'badge-primary' : 'badge-danger'}`}>
                      {calf.gender === 'male' ? <FaMars /> : <FaVenus />} {calf.gender}
                    </span>
                  </td>
                  <td className="hide-tablet">{new Date(calf.birthDate).toLocaleDateString()}</td>
                  <td className="hide-tablet">{calf.birthWeight} kg</td>
                  <td>{Math.floor((new Date() - new Date(calf.birthDate)) / (1000 * 60 * 60 * 24))} days</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn-icon-only btn-primary" onClick={() => openModal(calf)} title="Edit">
                        <FaEdit />
                      </button>
                      <button className="btn-icon-only btn-danger" onClick={() => handleDelete(calf._id)} title="Delete">
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <FaBaby size={48} />
          <p>No calves recorded yet</p>
          <button className="btn btn-primary" onClick={() => openModal()}>
            <FaPlus /> Add First Calf
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCalf ? 'Edit Calf' : 'Add New Calf'}</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Calf Animal *</label>
                <select
                  className="form-select"
                  value={formData.animalId}
                  onChange={e => setFormData({...formData, animalId: e.target.value})}
                  required
                >
                  <option value="">Select Animal</option>
                  {animals.map(animal => (
                    <option key={animal._id} value={animal._id}>{animal.tagNumber} - {animal.name || animal.breed}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Mother *</label>
                <select
                  className="form-select"
                  value={formData.motherId}
                  onChange={e => setFormData({...formData, motherId: e.target.value})}
                  required
                >
                  <option value="">Select Mother</option>
                  {animals.filter(a => a.gender === 'female').map(animal => (
                    <option key={animal._id} value={animal._id}>{animal.tagNumber} - {animal.name || animal.breed}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Birth Date *</label>
                  <input type="date" className="form-input" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Birth Weight (kg) *</label>
                  <input type="number" step="0.01" className="form-input" value={formData.birthWeight} onChange={e => setFormData({...formData, birthWeight: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select className="form-select" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} required>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingCalf ? 'Update' : 'Add'} Calf</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calves;
