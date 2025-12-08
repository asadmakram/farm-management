import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTint } from 'react-icons/fa';
import api from '../utils/api';
import milkApi from '../utils/milkApi';
import { useMilkStore } from '../store/milkStore';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './PageStyles.css';

const MilkProduction = () => {
  const { user } = useAuth();
  const { entries, listByDate, upsertEntry, deleteEntry } = useMilkStore();
  const [records, setRecords] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    animalId: '',
    date: new Date().toISOString().split('T')[0],
    morningLiters: '',
    morningFat: '',
    morningSnf: '',
    eveningLiters: '',
    eveningFat: '',
    eveningSnf: '',
    notes: ''
  });
  const [mode, setMode] = useState('per-animal');
  const [totalData, setTotalData] = useState({ date: new Date().toISOString().split('T')[0], morningTotal: '', eveningTotal: '' });
  const [divideEvenly, setDivideEvenly] = useState(true);
  const [manualAssignments, setManualAssignments] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [animalsRes, entriesRes] = await Promise.all([
        api.get('/animals'),
        listByDate(user?.farmId, new Date().toISOString().split('T')[0])
      ]);
      setAnimals(animalsRes.data.data.filter(a => a.status === 'active' && a.gender === 'female'));
      setRecords(entries);
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching data');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (mode === 'per-animal') {
        const sessions = {};
        if (formData.morningLiters) {
          sessions.morning = { liters: parseFloat(formData.morningLiters) };
          if (formData.morningFat) sessions.morning.fat = parseFloat(formData.morningFat);
          if (formData.morningSnf) sessions.morning.snf = parseFloat(formData.morningSnf);
        }
        if (formData.eveningLiters) {
          sessions.evening = { liters: parseFloat(formData.eveningLiters) };
          if (formData.eveningFat) sessions.evening.fat = parseFloat(formData.eveningFat);
          if (formData.eveningSnf) sessions.evening.snf = parseFloat(formData.eveningSnf);
        }

        if (Object.keys(sessions).length === 0) {
          toast.error('Please enter at least one session');
          setIsSubmitting(false);
          return;
        }

        await upsertEntry({
          farmId: user?.farmId,
          animalId: formData.animalId,
          date: formData.date,
          sessions,
          notes: formData.notes || undefined
        });
        toast.success('Milk production record added');
      } else {
        const activeAnimals = animals.filter(a => a.status === 'active' && a.gender === 'female');
        if (activeAnimals.length === 0) {
          toast.error('No active female animals');
          setIsSubmitting(false);
          return;
        }

        if (divideEvenly) {
          const morning = Number(totalData.morningTotal || 0);
          const evening = Number(totalData.eveningTotal || 0);
          if (morning === 0 && evening === 0) {
            toast.error('Enter at least one total value');
            setIsSubmitting(false);
            return;
          }
          const count = activeAnimals.length;
          const perMorning = +(morning / count).toFixed(2);
          const perEvening = +(evening / count).toFixed(2);
          for (const a of activeAnimals) {
            const sessions = {};
            if (morning > 0) sessions.morning = { liters: perMorning };
            if (evening > 0) sessions.evening = { liters: perEvening };
            await upsertEntry({
              farmId: user?.farmId,
              animalId: a._id,
              date: totalData.date,
              sessions,
              notes: 'Auto divided from total'
            });
          }
          toast.success('Production divided among animals');
        } else {
          const entries = Object.keys(manualAssignments);
          if (entries.length === 0) {
            toast.error('No assignments provided');
            setIsSubmitting(false);
            return;
          }
          for (const animalId of entries) {
            const sessions = {};
            if (manualAssignments[animalId].morning) {
              sessions.morning = { liters: parseFloat(manualAssignments[animalId].morning) };
            }
            if (manualAssignments[animalId].evening) {
              sessions.evening = { liters: parseFloat(manualAssignments[animalId].evening) };
            }
            if (Object.keys(sessions).length > 0) {
              await upsertEntry({
                farmId: user?.farmId,
                animalId,
                date: totalData.date,
                sessions,
                notes: 'Manual assignment'
              });
            }
          }
          toast.success('Manual assignments recorded');
        }
      }
      fetchData();
      setShowModal(false);
      setFormData({
        animalId: '',
        date: new Date().toISOString().split('T')[0],
        morningLiters: '',
        morningFat: '',
        morningSnf: '',
        eveningLiters: '',
        eveningFat: '',
        eveningSnf: '',
        notes: ''
      });
      setTotalData({ date: new Date().toISOString().split('T')[0], morningTotal: '', eveningTotal: '' });
      setManualAssignments({});
      setMode('per-animal');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error saving record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteEntry(id);
        toast.success('Record deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Error deleting record');
      }
    }
  };

  const handleManualAssignmentChange = (animalId, field, value) => {
    setManualAssignments(prev => ({ ...prev, [animalId]: { ...prev[animalId], [field]: value } }));
  };

  const openModal = () => {
    setMode('per-animal');
    setFormData({ animalId: '', date: new Date().toISOString().split('T')[0], morningYield: '', eveningYield: '', quality: 'good', notes: '' });
    setTotalData({ date: new Date().toISOString().split('T')[0], morningTotal: '', eveningTotal: '' });
    setManualAssignments({});
    setDivideEvenly(true);
    setShowModal(true);
  };

  if (loading) return <div className="container mt-3">Loading...</div>;

  return (
    <div className="container mt-3">
      <div className="page-header-mobile">
        <h1 className="page-title"><FaTint /> Milk Production</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <FaPlus /> <span className="btn-text">Add Record</span>
        </button>
      </div>

      {records.length > 0 ? (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Animal</th>
                <th className="text-right">Morning</th>
                <th className="text-right">Evening</th>
                <th className="text-right">Total</th>
                <th className="hide-mobile">Quality</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {records.map(record => (
                <tr key={record._id}>
                  <td data-label="Date">{new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                  <td data-label="Animal">{record.animalId?.tagNumber || 'N/A'}</td>
                  <td data-label="Morning" className="text-right">{record.morningYield}L</td>
                  <td data-label="Evening" className="text-right">{record.eveningYield}L</td>
                  <td data-label="Total" className="text-right"><strong>{record.totalYield}L</strong></td>
                  <td data-label="Quality" className="hide-mobile">
                    <span className={`badge badge-${record.quality === 'excellent' ? 'success' : record.quality === 'good' ? 'info' : 'warning'}`}>
                      {record.quality}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-icon-only danger" 
                      onClick={() => handleDelete(record._id)}
                      title="Delete record"
                    >
                      <FaTrash size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <FaTint size={48} />
          <p>No production records yet</p>
          <button className="btn btn-primary" onClick={() => openModal()}>
            <FaPlus /> Add First Record
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Milk Production Record</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Record Mode</label>
                <div className="form-row">
                  <label>
                    <input type="radio" name="mode" value="per-animal" checked={mode === 'per-animal'} onChange={() => setMode('per-animal')} /> Per Animal
                  </label>
                  <label>
                    <input type="radio" name="mode" value="total-day" checked={mode === 'total-day'} onChange={() => setMode('total-day')} /> Total For Day
                  </label>
                </div>
              </div>
              {mode === 'per-animal' ? (
                <>
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
                    <label className="form-label">Date *</label>
                    <input type="date" className="form-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Morning Yield (L) *</label>
                      <input type="number" step="0.01" className="form-input" value={formData.morningYield} onChange={e => setFormData({...formData, morningYield: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Evening Yield (L) *</label>
                      <input type="number" step="0.01" className="form-input" value={formData.eveningYield} onChange={e => setFormData({...formData, eveningYield: e.target.value})} required />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Date *</label>
                      <input type="date" className="form-input" value={totalData.date} onChange={e => setTotalData({...totalData, date: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Total Morning (L)</label>
                      <input type="number" step="0.01" className="form-input" value={totalData.morningTotal} onChange={e => setTotalData({...totalData, morningTotal: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Total Evening (L)</label>
                      <input type="number" step="0.01" className="form-input" value={totalData.eveningTotal} onChange={e => setTotalData({...totalData, eveningTotal: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Divide Method</label>
                    <div className="form-row">
                      <label>
                        <input type="radio" name="divide" value="even" checked={divideEvenly} onChange={() => setDivideEvenly(true)} /> Divide Evenly
                      </label>
                      <label>
                        <input type="radio" name="divide" value="manual" checked={!divideEvenly} onChange={() => setDivideEvenly(false)} /> Assign Manually
                      </label>
                    </div>
                  </div>
                  {!divideEvenly && (
                    <div className="form-row">
                      <div className="card" style={{ width: '100%' }}>
                        <h4 className="card-title">Manual Assignments</h4>
                        <div className="grid grid-2" style={{ maxHeight: '40vh', overflowY: 'auto' }}>
                          {animals.map(a => (
                            <div key={a._id} className="card">
                              <strong>{a.tagNumber} - {a.name || a.breed}</strong>
                              <div className="form-group">
                                <label className="form-label">Morning (L)</label>
                                <input type="number" step="0.01" className="form-input" value={manualAssignments[a._id]?.morning || ''} onChange={e => handleManualAssignmentChange(a._id, 'morning', e.target.value)} />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Evening (L)</label>
                                <input type="number" step="0.01" className="form-input" value={manualAssignments[a._id]?.evening || ''} onChange={e => handleManualAssignmentChange(a._id, 'evening', e.target.value)} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {divideEvenly && (
                    <div className="form-group">
                      <label className="form-label">Preview (per animal)</label>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div>Animals: {animals.length}</div>
                        <div>Morning: {Number((Number(totalData.morningTotal||0)/(animals.length||1)).toFixed(2))} L / animal</div>
                        <div>Evening: {Number((Number(totalData.eveningTotal||0)/(animals.length||1)).toFixed(2))} L / animal</div>
                      </div>
                    </div>
                  )}
                </>
              )}
              {/* Date and yields are handled inside per-animal or total-day blocks */}
              <div className="form-group">
                <label className="form-label">Quality</label>
                <select
                  className="form-select"
                  value={formData.quality}
                  onChange={e => setFormData({...formData, quality: e.target.value})}
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="average">Average</option>
                  <option value="poor">Poor</option>
                </select>
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
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilkProduction;
