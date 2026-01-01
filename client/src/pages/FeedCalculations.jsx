import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import '../pages/PageStyles.css';
import '../pages/FeedStyles.css';

const FeedCalculations = () => {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState([]);
  const [feedCalculations, setFeedCalculations] = useState([]);
  const [feedCategories, setFeedCategories] = useState([]);
  const [newFeedItem, setNewFeedItem] = useState({
    name: '',
    category: '',
    quantityPerBag: '',
    unit: 'kg',
    pricePerBag: '',
    currency: 'PKR',
    description: '',
    supplier: '',
    shelfLife: { value: '', unit: 'days' }
  });
  const [newCalculation, setNewCalculation] = useState({
    feedItemId: '',
    quantityPerTime: '',
    numberOfTimesPerDay: 2,
    numberOfAnimals: ''
  });
  const [previewCalculation, setPreviewCalculation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('items');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, calculationsRes, categoriesRes] = await Promise.all([
        api.get('/feed-items'),
        api.get('/feed-calculations'),
        api.get('/feed-categories')
      ]);
      setFeedItems(itemsRes.data);
      setFeedCalculations(calculationsRes.data);
      setFeedCategories(categoriesRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedItemChange = (e) => {
    const { name, value } = e.target;
    setNewFeedItem(prev => ({ ...prev, [name]: value }));
  };

  const handleShelfLifeChange = (field, value) => {
    setNewFeedItem(prev => ({
      ...prev,
      shelfLife: { ...prev.shelfLife, [field]: value }
    }));
  };

  const handleCalculationChange = (e) => {
    const { name, value } = e.target;
    setNewCalculation(prev => ({ ...prev, [name]: value }));
  };

  const validateFeedItem = () => {
    const { name, quantityPerBag, pricePerBag } = newFeedItem;
    if (!name.trim()) {
      setError('Feed item name is required');
      return false;
    }
    if (isNaN(quantityPerBag) || quantityPerBag <= 0) {
      setError('Quantity per bag must be a positive number');
      return false;
    }
    if (isNaN(pricePerBag) || pricePerBag <= 0) {
      setError('Price per bag must be a positive number');
      return false;
    }
    return true;
  };

  const handleAddFeedItem = async (e) => {
    e.preventDefault();
    if (!validateFeedItem()) return;
    try {
      const itemData = {
        name: newFeedItem.name,
        quantityPerBag: parseFloat(newFeedItem.quantityPerBag),
        unit: newFeedItem.unit,
        pricePerBag: parseFloat(newFeedItem.pricePerBag),
        currency: newFeedItem.currency,
        description: newFeedItem.description,
        supplier: newFeedItem.supplier,
        shelfLife: newFeedItem.shelfLife.value ? newFeedItem.shelfLife : undefined
      };
      
      // Only include category if it has a value
      if (newFeedItem.category && newFeedItem.category !== '') {
        itemData.category = newFeedItem.category;
      }
      
      await api.post('/feed-items', itemData);
      fetchData();
      setNewFeedItem({
        name: '',
        category: '',
        quantityPerBag: '',
        unit: 'kg',
        pricePerBag: '',
        currency: 'USD',
        description: '',
        supplier: '',
        shelfLife: { value: '', unit: 'days' }
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const validateCalculation = () => {
    const { feedItemId, quantityPerTime, numberOfTimesPerDay, numberOfAnimals } = newCalculation;
    if (!feedItemId) {
      setError('Feed item is required');
      return false;
    }
    if (isNaN(quantityPerTime) || quantityPerTime <= 0) {
      setError('Quantity per time must be a positive number');
      return false;
    }
    if (isNaN(numberOfTimesPerDay) || numberOfTimesPerDay < 1) {
      setError('Number of times per day must be at least 1');
      return false;
    }
    if (isNaN(numberOfAnimals) || numberOfAnimals <= 0) {
      setError('Number of animals must be a positive number');
      return false;
    }
    return true;
  };

  const handlePreviewCalculation = async (e) => {
    e.preventDefault();
    if (!validateCalculation()) return;
    try {
      const response = await api.post('/feed-calculations/calculate/preview', {
        feedItemId: newCalculation.feedItemId,
        quantityPerTime: parseFloat(newCalculation.quantityPerTime),
        numberOfTimesPerDay: parseInt(newCalculation.numberOfTimesPerDay),
        numberOfAnimals: parseInt(newCalculation.numberOfAnimals)
      });
      setPreviewCalculation(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleAddCalculation = async (e) => {
    e.preventDefault();
    if (!validateCalculation()) return;
    try {
      await api.post('/feed-calculations', {
        feedItemId: newCalculation.feedItemId,
        quantityPerTime: parseFloat(newCalculation.quantityPerTime),
        numberOfTimesPerDay: parseInt(newCalculation.numberOfTimesPerDay),
        numberOfAnimals: parseInt(newCalculation.numberOfAnimals)
      });
      fetchData();
      setNewCalculation({
        feedItemId: '',
        quantityPerTime: '',
        numberOfTimesPerDay: 2,
        numberOfAnimals: ''
      });
      setPreviewCalculation(null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleDeleteFeedItem = async (id) => {
    if (window.confirm('Are you sure? This will also delete associated calculations.')) {
      try {
        await api.delete(`/feed-items/${id}`);
        fetchData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleDeleteCalculation = async (id) => {
    if (window.confirm('Are you sure you want to delete this calculation?')) {
      try {
        await api.delete(`/feed-calculations/${id}`);
        fetchData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-container">
      <h1>Feed Calculations</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          Feed Items
        </button>
        <button
          className={`tab-button ${activeTab === 'calculations' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculations')}
        >
          Calculations
        </button>
      </div>

      {/* Feed Items Tab */}
      {activeTab === 'items' && (
        <>
          <div className="section">
            <h2>Add New Feed Item</h2>
            <form onSubmit={handleAddFeedItem} className="feed-item-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={newFeedItem.name}
                    onChange={handleFeedItemChange}
                    placeholder="e.g., Corn"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    name="category"
                    value={newFeedItem.category}
                    onChange={handleFeedItemChange}
                  >
                    <option value="">Select Category</option>
                    {feedCategories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantity per Bag *</label>
                  <input
                    type="number"
                    name="quantityPerBag"
                    value={newFeedItem.quantityPerBag}
                    onChange={handleFeedItemChange}
                    placeholder="e.g., 50"
                    step="0.1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select
                    name="unit"
                    value={newFeedItem.unit}
                    onChange={handleFeedItemChange}
                  >
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                    <option value="g">g</option>
                    <option value="mg">mg</option>
                    <option value="tons">tons</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Price per Bag *</label>
                  <input
                    type="number"
                    name="pricePerBag"
                    value={newFeedItem.pricePerBag}
                    onChange={handleFeedItemChange}
                    placeholder="e.g., 150"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Supplier</label>
                  <input
                    type="text"
                    name="supplier"
                    value={newFeedItem.supplier}
                    onChange={handleFeedItemChange}
                    placeholder="Supplier name"
                  />
                </div>
                <div className="form-group">
                  <label>Shelf Life</label>
                  <div className="shelf-life-input">
                    <input
                      type="number"
                      value={newFeedItem.shelfLife.value}
                      onChange={(e) => handleShelfLifeChange('value', e.target.value)}
                      placeholder="e.g., 6"
                      step="1"
                    />
                    <select
                      value={newFeedItem.shelfLife.unit}
                      onChange={(e) => handleShelfLifeChange('unit', e.target.value)}
                    >
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={newFeedItem.description}
                  onChange={handleFeedItemChange}
                  placeholder="Add notes about this feed item"
                  rows="3"
                />
              </div>

              <button type="submit" className="btn btn-primary">Add Feed Item</button>
            </form>
          </div>

          <div className="section">
            <div className="section-header">
              <h2>Feed Items</h2>
              <div className="export-buttons">
                <button onClick={() => exportToCSV(feedItems, 'feed_items.csv')} className="btn btn-sm btn-outline-primary">
                  Export CSV
                </button>
                <button onClick={() => exportToPDF(feedItems, 'feed_items.pdf')} className="btn btn-sm btn-outline-danger">
                  Export PDF
                </button>
              </div>
            </div>
            {feedItems.length === 0 ? (
              <p className="text-muted">No feed items yet</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Qty/Bag</th>
                    <th>Unit</th>
                    <th>Price/Bag</th>
                    <th>Supplier</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feedItems.map(item => (
                    <tr key={item._id}>
                      <td>{item.name}</td>
                      <td>{item.category?.name || '-'}</td>
                      <td>{item.quantityPerBag}</td>
                      <td>{item.unit}</td>
                      <td>${item.pricePerBag.toFixed(2)}</td>
                      <td>{item.supplier || '-'}</td>
                      <td>{item.description}</td>
                      <td>
                        <button
                          onClick={() => handleDeleteFeedItem(item._id)}
                          className="btn btn-sm btn-danger"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Calculations Tab */}
      {activeTab === 'calculations' && (
        <>
          <div className="section">
            <h2>Create New Feed Calculation</h2>
            <form onSubmit={handleAddCalculation} className="calculation-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Feed Item *</label>
                  <select
                    name="feedItemId"
                    value={newCalculation.feedItemId}
                    onChange={handleCalculationChange}
                    required
                  >
                    <option value="">Select a feed item</option>
                    {feedItems.map(item => (
                      <option key={item._id} value={item._id}>{item.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity per Time (kg) *</label>
                  <input
                    type="number"
                    name="quantityPerTime"
                    value={newCalculation.quantityPerTime}
                    onChange={handleCalculationChange}
                    placeholder="e.g., 2.5"
                    step="0.1"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Times per Day *</label>
                  <input
                    type="number"
                    name="numberOfTimesPerDay"
                    value={newCalculation.numberOfTimesPerDay}
                    onChange={handleCalculationChange}
                    min="1"
                    max="10"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Number of Animals *</label>
                  <input
                    type="number"
                    name="numberOfAnimals"
                    value={newCalculation.numberOfAnimals}
                    onChange={handleCalculationChange}
                    placeholder="e.g., 50"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={handlePreviewCalculation} className="btn btn-info">
                  Preview Calculation
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Calculation
                </button>
              </div>
            </form>
          </div>

          {/* Preview Calculation */}
          {previewCalculation && (
            <div className="section preview-section">
              <h2>Calculation Preview: {previewCalculation.feedItem.name}</h2>
              <div className="preview-grid">
                <div className="preview-item">
                  <h4>Daily</h4>
                  <p className="amount">{previewCalculation.calculation.quantityPerDay.toFixed(2)} kg</p>
                </div>
                <div className="preview-item">
                  <h4>10 Days</h4>
                  <p className="amount">{previewCalculation.calculation.quantityPer10Days.toFixed(2)} kg</p>
                  <p className="sub-text">Cost: ${previewCalculation.calculation.costPer10Days.toFixed(2)}</p>
                  <p className="sub-text">Bags: {previewCalculation.calculation.bagsRequired10Days}</p>
                </div>
                <div className="preview-item">
                  <h4>20 Days</h4>
                  <p className="amount">{previewCalculation.calculation.quantityPer20Days.toFixed(2)} kg</p>
                  <p className="sub-text">Cost: ${previewCalculation.calculation.costPer20Days.toFixed(2)}</p>
                  <p className="sub-text">Bags: {previewCalculation.calculation.bagsRequired20Days}</p>
                </div>
                <div className="preview-item">
                  <h4>30 Days</h4>
                  <p className="amount">{previewCalculation.calculation.quantityPer30Days.toFixed(2)} kg</p>
                  <p className="sub-text">Cost: ${previewCalculation.calculation.costPer30Days.toFixed(2)}</p>
                  <p className="sub-text">Bags: {previewCalculation.calculation.bagsRequired30Days}</p>
                </div>
              </div>
            </div>
          )}

          {/* Calculations List */}
          <div className="section">
            <div className="section-header">
              <h2>Feed Calculations</h2>
              <div className="export-buttons">
                <button onClick={() => exportToCSV(feedCalculations, 'feed_calculations.csv')} className="btn btn-sm btn-outline-primary">
                  Export CSV
                </button>
                <button onClick={() => exportToPDF(feedCalculations, 'feed_calculations.pdf')} className="btn btn-sm btn-outline-danger">
                  Export PDF
                </button>
              </div>
            </div>
            {feedCalculations.length === 0 ? (
              <p className="text-muted">No calculations yet</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Feed Item</th>
                    <th>Qty/Time</th>
                    <th>Times/Day</th>
                    <th>Animals</th>
                    <th>Qty/Day (kg)</th>
                    <th>Qty/10D (kg)</th>
                    <th>Bags/10D</th>
                    <th>Cost/10 Days</th>
                    <th>Cost/30 Days</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feedCalculations.map(calc => (
                    <tr key={calc._id}>
                      <td>{calc.feedItemId?.name || 'N/A'}</td>
                      <td>{calc.quantityPerTime}</td>
                      <td>{calc.numberOfTimesPerDay}</td>
                      <td>{calc.numberOfAnimals}</td>
                      <td>{calc.quantityPerDay.toFixed(2)}</td>
                      <td>{calc.quantityPer10Days?.toFixed(2) || 'N/A'}</td>
                      <td>{calc.bagsRequired10Days || 'N/A'}</td>
                      <td>${calc.costPer10Days.toFixed(2)}</td>
                      <td>${calc.costPer30Days.toFixed(2)}</td>
                      <td>
                        <button
                          onClick={() => handleDeleteCalculation(calc._id)}
                          className="btn btn-sm btn-danger"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FeedCalculations;
