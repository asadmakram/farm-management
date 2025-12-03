import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCheckCircle, FaPause, FaTag, FaDollarSign } from 'react-icons/fa';
import { GiCow } from 'react-icons/gi';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './PageStyles.css';

const Animals = () => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    tagNumber: '',
    name: '',
    breed: '',
    dateOfBirth: '',
    gender: 'female',
    status: 'active',
    purchaseDate: '',
    purchasePrice: '',
    weight: '',
    notes: ''
  });

  useEffect(() => {
    fetchAnimals();
  }, []);

  const fetchAnimals = async () => {
    try {
      const response = await api.get('/animals');
      setAnimals(response.data.data);
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching animals');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAnimal) {
        await api.put(`/animals/${editingAnimal._id}`, formData);
        toast.success('Animal updated successfully');
      } else {
        await api.post('/animals', formData);
        toast.success('Animal added successfully');
      }
      fetchAnimals();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving animal');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this animal?')) {
      try {
        await api.delete(`/animals/${id}`);
        toast.success('Animal deleted successfully');
        fetchAnimals();
      } catch (error) {
        toast.error('Error deleting animal');
      }
    }
  };

  const openModal = (animal = null) => {
    if (animal) {
      setEditingAnimal(animal);
      setFormData({
        ...animal,
        dateOfBirth: animal.dateOfBirth.split('T')[0],
        purchaseDate: animal.purchaseDate?.split('T')[0] || ''
      });
    } else {
      setEditingAnimal(null);
      setFormData({
        tagNumber: '',
        name: '',
        breed: '',
        dateOfBirth: '',
        gender: 'female',
        status: 'active',
        purchaseDate: '',
        purchasePrice: '',
        weight: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAnimal(null);
  };

  if (loading) return <div className="container mt-3">Loading...</div>;

  const activeCount = animals.filter(a => a.status === 'active').length;
  const dryCount = animals.filter(a => a.status === 'dry').length;
  const soldCount = animals.filter(a => a.status === 'sold').length;
  const totalValue = animals.reduce((sum, a) => sum + (a.purchasePrice || 0), 0);

  const filteredAnimals = filterStatus === 'all' 
    ? animals 
    : animals.filter(a => a.status === filterStatus);

  return (
    <div className="container mt-3">
      <div className="page-header-mobile">
        <h1 className="page-title"><GiCow /> Animals</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <FaPlus /> <span className="hide-mobile">Add Animal</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'var(--success-color)' }}>
            <FaCheckCircle />
          </div>
          <div className="summary-content">
            <span className="summary-label">Active</span>
            <span className="summary-value">{activeCount}</span>
            <span className="summary-sub">Producing milk</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'var(--warning-color)' }}>
            <FaPause />
          </div>
          <div className="summary-content">
            <span className="summary-label">Dry</span>
            <span className="summary-value">{dryCount}</span>
            <span className="summary-sub">Not producing</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'var(--primary-color)' }}>
            <FaTag />
          </div>
          <div className="summary-content">
            <span className="summary-label">Total</span>
            <span className="summary-value">{animals.length}</span>
            <span className="summary-sub">All animals</span>
          </div>
        </div>
      </div>

      {/* Total Value Card */}
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1rem', opacity: 0.9 }}>Total Investment Value</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Rs {totalValue.toLocaleString()}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filters-section">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All ({animals.length})
          </button>
          <button 
            className={`filter-tab ${filterStatus === 'active' ? 'active' : ''}`}
            onClick={() => setFilterStatus('active')}
          >
            Active ({activeCount})
          </button>
          <button 
            className={`filter-tab ${filterStatus === 'dry' ? 'active' : ''}`}
            onClick={() => setFilterStatus('dry')}
          >
            Dry ({dryCount})
          </button>
          <button 
            className={`filter-tab ${filterStatus === 'sold' ? 'active' : ''}`}
            onClick={() => setFilterStatus('sold')}
          >
            Sold ({soldCount})
          </button>
        </div>
      </div>

      {filteredAnimals.length > 0 ? (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tag #</th>
                <th className="hide-mobile">Name</th>
                <th>Breed</th>
                <th className="hide-tablet">Gender</th>
                <th className="hide-tablet">Age</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnimals.map(animal => (
                <tr key={animal._id}>
                  <td><strong>{animal.tagNumber}</strong></td>
                  <td className="hide-mobile">{animal.name || '-'}</td>
                  <td>{animal.breed}</td>
                  <td className="hide-tablet">{animal.gender}</td>
                  <td className="hide-tablet">{Math.floor((new Date() - new Date(animal.dateOfBirth)) / (1000 * 60 * 60 * 24 * 365))} yrs</td>
                  <td>
                    <span className={`badge ${
                      animal.status === 'active' ? 'badge-success' : 
                      animal.status === 'dry' ? 'badge-warning' : 
                      animal.status === 'sold' ? 'badge-primary' : 'badge-danger'
                    }`}>
                      {animal.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn-icon-only btn-primary" onClick={() => openModal(animal)} title="Edit">
                        <FaEdit />
                      </button>
                      <button className="btn-icon-only btn-danger" onClick={() => handleDelete(animal._id)} title="Delete">
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
          <GiCow size={48} />
          <p>No animals found</p>
          <button className="btn btn-primary" onClick={() => openModal()}>
            <FaPlus /> Add Your First Animal
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingAnimal ? 'Edit Animal' : 'Add New Animal'}</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tag Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.tagNumber}
                    onChange={e => setFormData({...formData, tagNumber: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Breed *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.breed}
                    onChange={e => setFormData({...formData, breed: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender *</label>
                  <select
                    className="form-select"
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                    required
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date of Birth *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.dateOfBirth}
                    onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="dry">Dry</option>
                    <option value="sold">Sold</option>
                    <option value="deceased">Deceased</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Purchase Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.purchaseDate}
                    onChange={e => setFormData({...formData, purchaseDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Purchase Price</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.purchasePrice}
                    onChange={e => setFormData({...formData, purchasePrice: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.weight}
                  onChange={e => setFormData({...formData, weight: e.target.value})}
                />
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
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAnimal ? 'Update' : 'Add'} Animal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Animals;
