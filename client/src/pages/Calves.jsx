import React, { useState, useEffect } from 'react';
import { FaBaby, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
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

  if (loading) return <div className="container mt-3">Loading...</div>;

  return (
    <div className="container mt-3">
      <div className="flex-between mb-3">
        <h1 className="page-title"><FaBaby /> Calves</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <FaPlus /> Add Calf
        </button>
      </div>

      {calves.length > 0 ? (
        <div className="grid grid-3">
          {calves.map(calf => (
            <div key={calf._id} className="card">
              <div className="animal-header">
                <h3>{calf.animalId?.tagNumber || 'N/A'}</h3>
                <span className={`status-badge ${calf.status}`}>{calf.status}</span>
              </div>
              <div className="animal-details">
                <p><strong>Mother:</strong> {calf.motherId?.tagNumber || 'N/A'}</p>
                <p><strong>Gender:</strong> {calf.gender}</p>
                <p><strong>Birth Date:</strong> {new Date(calf.birthDate).toLocaleDateString()}</p>
                <p><strong>Birth Weight:</strong> {calf.birthWeight} kg</p>
                <p><strong>Age:</strong> {Math.floor((new Date() - new Date(calf.birthDate)) / (1000 * 60 * 60 * 24))} days</p>
              </div>
              <div className="card-actions">
                <button className="btn btn-outline btn-sm" onClick={() => openModal(calf)}>
                  <FaEdit /> Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={async () => {
                  if (window.confirm('Are you sure you want to delete this calf?')) {
                    try {
                      await api.delete(`/calves/${calf._id}`);
                      toast.success('Calf deleted successfully');
                      fetchCalves();
                    } catch (error) {
                      toast.error('Error deleting calf');
                    }
                  }
                }}>
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <FaBaby size={48} />
          <p>No calves recorded yet</p>
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
