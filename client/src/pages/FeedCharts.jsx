import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import '../pages/PageStyles.css';

const FeedCharts = () => {
  const { user } = useAuth();
  const [feedCharts, setFeedCharts] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [selectedChart, setSelectedChart] = useState(null);
  const [chartCalculations, setChartCalculations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingChart, setEditingChart] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    numberOfAnimals: '',
    animalType: '',
    feedItems: [],
    calculationNotes: '',
    isTemplate: false
  });

  const [selectedFeedItems, setSelectedFeedItems] = useState([]);

  useEffect(() => {
    fetchFeedCharts();
    fetchFeedItems();
  }, []);

  const fetchFeedCharts = async () => {
    try {
      const response = await api.get('/feed-charts');
      setFeedCharts(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchFeedItems = async () => {
    try {
      const response = await api.get('/feed-items?isActive=true');
      setFeedItems(response.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Chart name is required');
      return false;
    }
    if (!formData.numberOfAnimals || parseInt(formData.numberOfAnimals) <= 0) {
      setError('Number of animals must be a positive number');
      return false;
    }
    if (selectedFeedItems.length === 0) {
      setError('At least one feed item must be selected');
      return false;
    }

    // Validate each feed item entry
    for (const item of selectedFeedItems) {
      if (!item.quantityPerTime || item.quantityPerTime <= 0) {
        setError(`Quantity per time must be positive for ${item.feedItemName}`);
        return false;
      }
      if (!item.numberOfTimesPerDay || item.numberOfTimesPerDay < 1) {
        setError(`Number of times per day must be at least 1 for ${item.feedItemName}`);
        return false;
      }
    }

    return true;
  };

  const handleAddFeedItem = () => {
    setSelectedFeedItems(prev => [...prev, {
      feedItemId: '',
      quantityPerTime: '',
      numberOfTimesPerDay: 2
    }]);
  };

  const handleRemoveFeedItem = (index) => {
    setSelectedFeedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleFeedItemChange = (index, field, value) => {
    setSelectedFeedItems(prev => {
      const updated = [...prev];
      updated[index][field] = field === 'quantityPerTime' || field === 'numberOfTimesPerDay' ? 
        (value === '' ? '' : parseFloat(value)) : value;
      return updated;
    });
  };

  const handleCreateChart = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const chartData = {
        ...formData,
        numberOfAnimals: parseInt(formData.numberOfAnimals),
        feedItems: selectedFeedItems.map(item => ({
          feedItemId: item.feedItemId,
          quantityPerTime: parseFloat(item.quantityPerTime),
          numberOfTimesPerDay: parseInt(item.numberOfTimesPerDay)
        }))
      };

      if (editingChart) {
        await api.put(`/feed-charts/${editingChart._id}`, chartData);
      } else {
        await api.post('/feed-charts', chartData);
      }

      fetchFeedCharts();
      resetForm();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      numberOfAnimals: '',
      animalType: '',
      feedItems: [],
      calculationNotes: '',
      isTemplate: false
    });
    setSelectedFeedItems([]);
    setShowForm(false);
    setEditingChart(null);
  };

  const handleEditChart = (chart) => {
    setEditingChart(chart);
    setFormData({
      name: chart.name,
      description: chart.description,
      numberOfAnimals: chart.numberOfAnimals,
      animalType: chart.animalType,
      calculationNotes: chart.calculationNotes,
      isTemplate: chart.isTemplate
    });

    // Reconstruct selected feed items with proper formatting
    const feedItemsForEdit = chart.feedItems.map(item => ({
      feedItemId: item.feedItemId._id,
      feedItemName: item.feedItemId.name,
      quantityPerTime: item.quantityPerTime,
      numberOfTimesPerDay: item.numberOfTimesPerDay || 2
    }));
    setSelectedFeedItems(feedItemsForEdit);
    setShowForm(true);
  };

  const handleDeleteChart = async (id) => {
    if (window.confirm('Are you sure you want to delete this feed chart?')) {
      try {
        await api.delete(`/feed-charts/${id}`);
        fetchFeedCharts();
        setSelectedChart(null);
        setChartCalculations(null);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleViewCalculations = async (chart) => {
    try {
      const response = await api.get(`/feed-charts/${chart._id}/calculations`);
      setSelectedChart(chart);
      setChartCalculations(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExportChart = async (format) => {
    if (!chartCalculations) return;

    const exportData = {
      feedChart: chartCalculations.feedChart,
      calculations: chartCalculations.calculations,
      generatedAt: new Date().toLocaleString()
    };

    if (format === 'csv') {
      exportToCSV(exportData, `feed_chart_${selectedChart.name.replace(/\s+/g, '_')}.csv`);
    } else if (format === 'pdf') {
      exportToPDF(exportData, `feed_chart_${selectedChart.name.replace(/\s+/g, '_')}.pdf`);
    }
  };

  if (loading) return <div className="loading">Loading feed charts...</div>;

  return (
    <div className="page-container">
      <h1>Feed Distribution Charts</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Chart Creation/Editing Form */}
      {showForm && (
        <div className="section form-section">
          <h2>{editingChart ? 'Edit Feed Chart' : 'Create New Feed Chart'}</h2>
          <form onSubmit={handleCreateChart}>
            <div className="form-row">
              <div className="form-group">
                <label>Chart Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g., Summer Feed Plan"
                  required
                />
              </div>
              <div className="form-group">
                <label>Number of Animals *</label>
                <input
                  type="number"
                  name="numberOfAnimals"
                  value={formData.numberOfAnimals}
                  onChange={handleFormChange}
                  placeholder="e.g., 50"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Animal Type</label>
                <input
                  type="text"
                  name="animalType"
                  value={formData.animalType}
                  onChange={handleFormChange}
                  placeholder="e.g., Dairy Cows"
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="isTemplate"
                    checked={formData.isTemplate}
                    onChange={handleFormChange}
                  />
                  Save as Template
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Add notes about this feed chart"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Calculation Notes</label>
              <textarea
                name="calculationNotes"
                value={formData.calculationNotes}
                onChange={handleFormChange}
                placeholder="Any specific notes about calculations"
                rows="2"
              />
            </div>

            {/* Feed Items Selection */}
            <div className="section">
              <h3>Feed Items Distribution</h3>
              {selectedFeedItems.length === 0 ? (
                <p className="text-muted">No feed items added yet</p>
              ) : (
                <div className="feed-items-list">
                  {selectedFeedItems.map((item, index) => (
                    <div key={index} className="feed-item-entry">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Feed Item *</label>
                          <select
                            value={item.feedItemId}
                            onChange={(e) => {
                              const selectedItem = feedItems.find(fi => fi._id === e.target.value);
                              handleFeedItemChange(index, 'feedItemId', e.target.value);
                              if (selectedItem) {
                                handleFeedItemChange(index, 'feedItemName', selectedItem.name);
                              }
                            }}
                            required
                          >
                            <option value="">Select a feed item</option>
                            {feedItems.map(fi => (
                              <option key={fi._id} value={fi._id}>{fi.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Quantity per Time (kg) *</label>
                          <input
                            type="number"
                            value={item.quantityPerTime}
                            onChange={(e) => handleFeedItemChange(index, 'quantityPerTime', e.target.value)}
                            placeholder="e.g., 2.5"
                            step="0.1"
                            min="0"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Times per Day *</label>
                          <input
                            type="number"
                            value={item.numberOfTimesPerDay}
                            onChange={(e) => handleFeedItemChange(index, 'numberOfTimesPerDay', e.target.value)}
                            min="1"
                            max="10"
                            required
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handleRemoveFeedItem(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="btn btn-secondary mt-2"
                onClick={handleAddFeedItem}
              >
                + Add Feed Item
              </button>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingChart ? 'Update Chart' : 'Create Chart'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Existing Charts List */}
      {!showForm && (
        <>
          <div className="section">
            <div className="section-header">
              <h2>Feed Charts</h2>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                + Create New Chart
              </button>
            </div>

            {feedCharts.length === 0 ? (
              <p className="text-muted">No feed charts created yet. Create one to get started!</p>
            ) : (
              <div className="charts-grid">
                {feedCharts.map(chart => (
                  <div key={chart._id} className="chart-card">
                    <div className="card-header">
                      <h3>{chart.name}</h3>
                      {chart.isTemplate && <span className="badge badge-info">Template</span>}
                    </div>
                    {chart.description && <p className="card-description">{chart.description}</p>}
                    <div className="card-info">
                      <span>Animals: <strong>{chart.numberOfAnimals}</strong></span>
                      {chart.animalType && <span>Type: <strong>{chart.animalType}</strong></span>}
                      <span>Items: <strong>{chart.feedItems.length}</strong></span>
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleViewCalculations(chart)}
                      >
                        View Calculations
                      </button>
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => handleEditChart(chart)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteChart(chart._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Calculations View */}
      {chartCalculations && (
        <div className="section calculations-section">
          <div className="section-header">
            <h2>Calculations for {selectedChart.name}</h2>
            <div className="export-buttons">
              <button onClick={() => handleExportChart('csv')} className="btn btn-sm btn-outline-primary">
                Export CSV
              </button>
              <button onClick={() => handleExportChart('pdf')} className="btn btn-sm btn-outline-danger">
                Export PDF
              </button>
            </div>
          </div>

          {/* Charts Summary */}
          <div className="calculations-summary">
            <div className="summary-item">
              <h4>Daily Costs</h4>
              <div className="cost-display">
                <div className="cost-value">${chartCalculations.calculations.perDay.totalCost.toFixed(2)}</div>
                <div className="cost-quantity">Total: {chartCalculations.calculations.perDay.totalQuantity.toFixed(2)} kg</div>
              </div>
            </div>
            <div className="summary-item">
              <h4>10-Day Costs</h4>
              <div className="cost-display">
                <div className="cost-value">${chartCalculations.calculations.per10Days.totalCost.toFixed(2)}</div>
                <div className="cost-quantity">Total: {chartCalculations.calculations.per10Days.totalQuantity.toFixed(2)} kg</div>
              </div>
            </div>
            <div className="summary-item">
              <h4>20-Day Costs</h4>
              <div className="cost-display">
                <div className="cost-value">${chartCalculations.calculations.per20Days.totalCost.toFixed(2)}</div>
                <div className="cost-quantity">Total: {chartCalculations.calculations.per20Days.totalQuantity.toFixed(2)} kg</div>
              </div>
            </div>
            <div className="summary-item">
              <h4>30-Day Costs</h4>
              <div className="cost-display">
                <div className="cost-value">${chartCalculations.calculations.per30Days.totalCost.toFixed(2)}</div>
                <div className="cost-quantity">Total: {chartCalculations.calculations.per30Days.totalQuantity.toFixed(2)} kg</div>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown Tables */}
          {['perDay', 'per10Days', 'per20Days', 'per30Days'].map(period => {
            const periodData = chartCalculations.calculations[period];
            const periodLabel = period === 'perDay' ? 'Daily' : period === 'per10Days' ? '10-Day' : period === 'per20Days' ? '20-Day' : '30-Day';

            return (
              <div key={period} className="table-section">
                <h3>{periodLabel} Breakdown</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Feed Item</th>
                      <th>Qty per Time (kg)</th>
                      <th>Times/Day</th>
                      <th>Total Quantity (kg)</th>
                      <th>Cost per Unit</th>
                      <th>Total Cost</th>
                      {(period === 'per10Days' || period === 'per20Days' || period === 'per30Days') && (
                        <th>Bags Required</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {periodData.byItem.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.feedItemName}</td>
                        <td>{item.quantityPerTime.toFixed(2)}</td>
                        <td>{item.numberOfTimesPerDay}</td>
                        <td>{item.quantity.toFixed(2)}</td>
                        <td>${(item.cost / item.quantity * chartCalculations.feedChart.numberOfAnimals).toFixed(2)}</td>
                        <td className="total-cost">${item.cost.toFixed(2)}</td>
                        {period === 'per10Days' && <td>{item.bagsRequired10Days}</td>}
                        {period === 'per20Days' && <td>{item.bagsRequired20Days}</td>}
                        {period === 'per30Days' && <td>{item.bagsRequired30Days}</td>}
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td colSpan="3"><strong>Total</strong></td>
                      <td><strong>{periodData.totalQuantity.toFixed(2)} kg</strong></td>
                      <td></td>
                      <td><strong>${periodData.totalCost.toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}

          <button className="btn btn-secondary" onClick={() => {
            setSelectedChart(null);
            setChartCalculations(null);
          }}>
            Back to Charts
          </button>
        </div>
      )}
    </div>
  );
};

export default FeedCharts;
