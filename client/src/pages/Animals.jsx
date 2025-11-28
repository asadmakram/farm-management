import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { GiCow } from 'react-icons/gi';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './PageStyles.css';

const Animals = () => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
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

  return (
    <div className="container mt-3">
      <div className="flex-between mb-3">
        <h1 className="page-title"><GiCow /> Animals</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <FaPlus /> Add Animal
        </button>
      </div>

      <div className="grid grid-3">
        {animals.map(animal => (
          <div key={animal._id} className="card animal-card">
            <div className="animal-header">
              <h3>{animal.tagNumber}</h3>
              <span className={`status-badge ${animal.status}`}>{animal.status}</span>
            </div>
            <div className="animal-details">
              <p><strong>Name:</strong> {animal.name || 'N/A'}</p>
              <p><strong>Breed:</strong> {animal.breed}</p>
              <p><strong>Gender:</strong> {animal.gender}</p>
              <p><strong>Age:</strong> {Math.floor((new Date() - new Date(animal.dateOfBirth)) / (1000 * 60 * 60 * 24 * 365))} years</p>
              {animal.weight && <p><strong>Weight:</strong> {animal.weight} kg</p>}
            </div>
            <div className="card-actions">
              <button className="btn btn-outline btn-sm" onClick={() => openModal(animal)}>
                <FaEdit /> Edit
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(animal._id)}>
                <FaTrash /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {animals.length === 0 && (
        <div className="empty-state">
          <GiCow size={48} />
          <p>No animals added yet</p>
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
