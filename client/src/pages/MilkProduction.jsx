import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTint } from 'react-icons/fa';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './PageStyles.css';

const MilkProduction = () => {
  const [records, setRecords] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    animalId: '',
    date: new Date().toISOString().split('T')[0],
    morningYield: '',
    eveningYield: '',
    quality: 'good',
    notes: ''
  });
  const [mode, setMode] = useState('total-day'); // 'per-animal' or 'total-day'
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
      const [recordsRes, animalsRes] = await Promise.all([
        api.get('/milk/production'),
        api.get('/animals')
      ]);
      setRecords(recordsRes.data.data);
      setAnimals(animalsRes.data.data.filter(a => a.status === 'active' && a.gender === 'female'));
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
        if (editingId) {
          await api.put(`/milk/production/${editingId}`, formData);
          toast.success('Milk production record updated successfully');
        } else {
          await api.post('/milk/production', formData);
          toast.success('Milk production record added successfully');
        }
      } else {
        // If editing and switching to total-day mode, delete the current record first
        if (editingId) {
          try {
            await api.delete(`/milk/production/${editingId}`);
          } catch (error) {
            toast.error('Error deleting original record');
            return;
          }
        }
        
        const activeAnimals = animals.filter(a => a.status === 'active' && a.gender === 'female');
        if (activeAnimals.length === 0) {
          toast.error('No active female animals to assign totals to');
          return;
        }
        if (divideEvenly) {
          const morning = Number(totalData.morningTotal || 0);
          const evening = Number(totalData.eveningTotal || 0);
          if (morning === 0 && evening === 0) {
            toast.error('Please enter at least one total value (morning or evening)');
            return;
          }
          const count = activeAnimals.length;
          const perMorning = +(morning / count).toFixed(2);
          const perEvening = +(evening / count).toFixed(2);
          for (const a of activeAnimals) {
            await api.post('/milk/production', {
              animalId: a._id,
              date: totalData.date,
              morningYield: perMorning,
              eveningYield: perEvening,
              quality: 'good',
              notes: 'Auto divided from total'
            });
          }
          toast.success(editingId ? 'Record updated and divided among animals' : 'Total production recorded and divided among animals');
        } else {
          const entries = Object.keys(manualAssignments);
          if (entries.length === 0) {
            toast.error('No per-animal assignments provided');
            return;
          }
          // Optional validation: check sums if totals provided
          const morningTotalProvided = Number(totalData.morningTotal || 0);
          const eveningTotalProvided = Number(totalData.eveningTotal || 0);
          if (morningTotalProvided > 0) {
            const sumMorning = entries.reduce((s, id) => s + Number(manualAssignments[id].morning || 0), 0);
            if (Math.abs(sumMorning - morningTotalProvided) > 0.01) {
              toast.error('Sum of manual morning allocations does not match total morning');
              return;
            }
          }
          if (eveningTotalProvided > 0) {
            const sumEvening = entries.reduce((s, id) => s + Number(manualAssignments[id].evening || 0), 0);
            if (Math.abs(sumEvening - eveningTotalProvided) > 0.01) {
              toast.error('Sum of manual evening allocations does not match total evening');
              return;
            }
          }
          for (const animalId of entries) {
            const m = Number(manualAssignments[animalId].morning || 0);
            const e2 = Number(manualAssignments[animalId].evening || 0);
            await api.post('/milk/production', {
              animalId,
              date: totalData.date,
              morningYield: m,
              eveningYield: e2,
              quality: 'good',
              notes: 'Manual assignment from total'
            });
          }
          toast.success(editingId ? 'Record updated with manual per-animal assignments' : 'Manual per-animal production recorded');
        }
      }
      fetchData();
      setShowModal(false);
      setEditingId(null);
      setFormData({
        animalId: '',
        date: new Date().toISOString().split('T')[0],
        morningYield: '',
        eveningYield: '',
        quality: 'good',
        notes: ''
      });
      setTotalData({ date: new Date().toISOString().split('T')[0], morningTotal: '', eveningTotal: '' });
      setManualAssignments({});
      setMode('total-day');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await api.delete(`/milk/production/${id}`);
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
    setEditingId(null);
    setMode('total-day');
    setFormData({ animalId: '', date: new Date().toISOString().split('T')[0], morningYield: '', eveningYield: '', quality: 'good', notes: '' });
    setTotalData({ date: new Date().toISOString().split('T')[0], morningTotal: '', eveningTotal: '' });
    setManualAssignments({});
    setDivideEvenly(true);
    setShowModal(true);
  };

  const handleModeChange = (newMode) => {
    if (newMode === mode) return;
    
    if (newMode === 'total-day') {
      // Switching to total-day: preserve date and populate totals from formData if available
      const currentDate = formData.date || totalData.date || new Date().toISOString().split('T')[0];
      const morningTotal = formData.morningYield ? Number(formData.morningYield) : (totalData.morningTotal || '');
      const eveningTotal = formData.eveningYield ? Number(formData.eveningYield) : (totalData.eveningTotal || '');
      setTotalData({
        date: currentDate,
        morningTotal: morningTotal,
        eveningTotal: eveningTotal
      });
    } else {
      // Switching to per-animal: preserve date, yields, quality, and notes from totalData/formData if available
      const currentDate = totalData.date || formData.date || new Date().toISOString().split('T')[0];
      const morningYield = totalData.morningTotal ? String(totalData.morningTotal) : (formData.morningYield || '');
      const eveningYield = totalData.eveningTotal ? String(totalData.eveningTotal) : (formData.eveningYield || '');
      setFormData(prev => ({
        ...prev,
        date: currentDate,
        morningYield: morningYield,
        eveningYield: eveningYield,
        // Preserve quality and notes if they exist
        quality: prev.quality || 'good',
        notes: prev.notes || ''
      }));
    }
    setMode(newMode);
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    setMode('total-day');
    const recordDate = new Date(record.date).toISOString().split('T')[0];
    setFormData({
      animalId: record.animalId?._id || record.animalId || '',
      date: recordDate,
      morningYield: record.morningYield || '',
      eveningYield: record.eveningYield || '',
      quality: record.quality || 'good',
      notes: record.notes || ''
    });
    // Pre-populate totalData with the record's yields so switching modes preserves data
    setTotalData({ 
      date: recordDate, 
      morningTotal: record.morningYield || '', 
      eveningTotal: record.eveningYield || '' 
    });
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
                <th style={{ width: '100px' }}></th>
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
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn-icon-only" 
                        onClick={() => handleEdit(record)}
                        title="Edit record"
                        style={{ color: '#3b82f6' }}
                      >
                        <FaEdit size={14} />
                      </button>
                      <button 
                        className="btn-icon-only danger" 
                        onClick={() => handleDelete(record._id)}
                        title="Delete record"
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
        <div className="modal-overlay" onClick={() => {
          setShowModal(false);
          setEditingId(null);
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Milk Production Record' : 'Add Milk Production Record'}</h2>
              <button className="modal-close" onClick={() => {
                setShowModal(false);
                setEditingId(null);
              }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Record Mode</label>
                <div className="form-row">
                  <label>
                    <input type="radio" name="mode" value="per-animal" checked={mode === 'per-animal'} onChange={() => handleModeChange('per-animal')} /> Per Animal
                  </label>
                  <label>
                    <input type="radio" name="mode" value="total-day" checked={mode === 'total-day'} onChange={() => handleModeChange('total-day')} /> Total For Day
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
                <button type="button" className="btn btn-outline" onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Record' : 'Add Record'}
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
