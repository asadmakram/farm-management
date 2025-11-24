import React, { useState, useEffect } from 'react';
import { FaPlus, FaMoneyBillWave } from 'react-icons/fa';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './PageStyles.css';

const MilkSales = () => {
  const [sales, setSales] = useState([]);
  const [contracts, setContracts] = useState([]);
  const defaultSummary = {
    totalQuantity: 0,
    totalRevenue: 0,
    bandhi: { quantity: 0, revenue: 0, count: 0 },
    mandi: { quantity: 0, revenue: 0, count: 0 },
    door_to_door: { quantity: 0, revenue: 0, count: 0 },
    pending: 0,
    received: 0
  };

  const [summary, setSummary] = useState(defaultSummary);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    saleType: 'bandhi',
    quantity: '',
    contractId: '',
    timeOfDay: 'morning',
    packagingCost: 0,
    customerName: '',
    ratePerLiter: '',
    paymentStatus: 'pending',
    notes: ''
  });

  useEffect(() => {
    fetchSales();
    fetchContracts();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await api.get('/milk/sales');
      setSales(response.data.data || []);
      setSummary(response.data.summary || defaultSummary);
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching sales');
      setSales([]);
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      const response = await api.get('/contracts?status=active');
      setContracts(response.data.contracts || []);
    } catch (error) {
      console.error('Error fetching contracts');
      setContracts([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity || 0),
        ratePerLiter: Number(formData.ratePerLiter || 0),
        packagingCost: Number(formData.packagingCost || 0)
      };
      
      // Remove fields not needed for specific sale types
      if (formData.saleType !== 'bandhi') delete payload.contractId;
      if (formData.saleType !== 'mandi' && formData.saleType !== 'bandhi') delete payload.timeOfDay;
      if (formData.saleType !== 'door_to_door') delete payload.packagingCost;
      
      await api.post('/milk/sales', payload);
      toast.success('Milk sale recorded successfully');
      fetchSales();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving sale');
    }
  };

  const updatePaymentStatus = async (saleId, newStatus) => {
    try {
      await api.put(`/milk/sales/${saleId}`, { paymentStatus: newStatus });
      toast.success('Payment status updated');
      fetchSales();
    } catch (error) {
      toast.error('Error updating payment status');
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      saleType: 'bandhi',
      quantity: '',
      contractId: '',
      timeOfDay: 'morning',
      packagingCost: 0,
      customerName: '',
      ratePerLiter: '',
      paymentStatus: 'pending',
      notes: ''
    });
  };

  const handleSaleTypeChange = (type) => {
    setFormData({
      ...formData,
      saleType: type,
      ratePerLiter: type === 'bandhi' ? '182.5' : type === 'door_to_door' ? '220' : ''
    });
  };

  const filteredSales = filterType === 'all' 
    ? (sales || [])
    : (sales || []).filter(sale => sale.saleType === filterType);

  if (loading) return <div className="container mt-3">Loading...</div>;

  return (
    <div className="container mt-3">
      <div className="flex-between mb-3">
        <h1 className="page-title"><FaMoneyBillWave /> Milk Sales</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add Sale
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-4 mb-3">
        <div className="card" style={{ padding: '1rem' }}>
          <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Bandhi (Contract)</h4>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
            {summary.bandhi?.quantity || 0}L
          </p>
          <small style={{ color: 'var(--text-secondary)' }}>₹{(summary.bandhi?.revenue || 0).toFixed(2)}</small>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Mandi (Market)</h4>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning-color)' }}>
            {summary.mandi?.quantity || 0}L
          </p>
          <small style={{ color: 'var(--text-secondary)' }}>₹{(summary.mandi?.revenue || 0).toFixed(2)}</small>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Door-to-Door</h4>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
            {summary.door_to_door?.quantity || 0}L
          </p>
          <small style={{ color: 'var(--text-secondary)' }}>₹{(summary.door_to_door?.revenue || 0).toFixed(2)}</small>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Revenue</h4>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            ₹{(summary.totalRevenue || 0).toFixed(2)}
          </p>
          <small style={{ color: 'var(--text-secondary)' }}>Pending: ₹{(summary.pending || 0).toFixed(2)}</small>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button 
          className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilterType('all')}
        >
          All Sales
        </button>
        <button 
          className={`btn ${filterType === 'bandhi' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilterType('bandhi')}
        >
          Bandhi
        </button>
        <button 
          className={`btn ${filterType === 'mandi' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilterType('mandi')}
        >
          Mandi
        </button>
        <button 
          className={`btn ${filterType === 'door_to_door' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilterType('door_to_door')}
        >
          Door-to-Door
        </button>
      </div>

      {/* Sales Table */}
      {filteredSales.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th className="text-left">Date</th>
                <th className="text-left">Sale Type</th>
                <th className="text-left">Customer/Vendor</th>
                <th className="text-center">Time</th>
                <th className="text-right">Quantity (L)</th>
                <th className="text-right">Rate/L</th>
                <th className="text-right">Total</th>
                <th className="text-center">Payment Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map(sale => (
                <tr key={sale._id}>
                  <td data-label="Date" className="text-left">{new Date(sale.date).toLocaleDateString()}</td>
                  <td data-label="Sale Type" className="text-left">
                    <span className={`status-badge ${sale.saleType}`}>
                      {sale.saleType === 'bandhi' ? '📋 Bandhi' : 
                       sale.saleType === 'mandi' ? '🏪 Mandi' : 
                       '🚪 Door-to-Door'}
                    </span>
                  </td>
                  <td data-label="Customer/Vendor" className="text-left">
                    {sale.contractId?.vendorName || sale.customerName || 'N/A'}
                  </td>
                  <td data-label="Time" className="text-center">
                    {(sale.saleType === 'mandi' || sale.saleType === 'bandhi') && sale.timeOfDay ? (
                      <span className={`status-badge ${sale.timeOfDay}`}>
                        {sale.timeOfDay === 'morning' ? '🌅 Morning' : '🌆 Evening'}
                      </span>
                    ) : '-'}
                  </td>
                  <td data-label="Quantity" className="text-right">{sale.quantity}</td>
                  <td data-label="Rate/L" className="text-right">₹{sale.ratePerLiter.toFixed(2)}</td>
                  <td data-label="Total" className="text-right"><strong>₹{sale.totalAmount.toFixed(2)}</strong></td>
                  <td data-label="Payment" className="text-center">
                    <select 
                      className={`status-select ${sale.paymentStatus}`}
                      value={sale.paymentStatus}
                      onChange={(e) => updatePaymentStatus(sale._id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="received">Received</option>
                      <option value="returned">Returned</option>
                    </select>
                  </td>
                  <td data-label="Notes" className="text-center">
                    {sale.notes && (
                      <small title={sale.notes}>📝</small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <FaMoneyBillWave size={48} />
          <p>No sales recorded yet</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Milk Sale</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Sale Type Selection */}
              <div className="form-section">
                <div className="form-section-title">
                  <span>🏷️</span>
                  <span>Sale Type</span>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="saleType"
                        value="bandhi"
                        checked={formData.saleType === 'bandhi'}
                        onChange={(e) => handleSaleTypeChange(e.target.value)}
                      />
                      <span>📋 Bandhi (Contract)</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="saleType"
                        value="mandi"
                        checked={formData.saleType === 'mandi'}
                        onChange={(e) => handleSaleTypeChange(e.target.value)}
                      />
                      <span>🏪 Mandi (Market)</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="saleType"
                        value="door_to_door"
                        checked={formData.saleType === 'door_to_door'}
                        onChange={(e) => handleSaleTypeChange(e.target.value)}
                      />
                      <span>🚪 Door-to-Door</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="form-section">
                <div className="form-section-title">
                  <span>📋</span>
                  <span>Basic Information</span>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">📅 Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">🥛 Quantity (Liters) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.quantity}
                      onChange={e => setFormData({...formData, quantity: e.target.value})}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Bandhi specific fields */}
              {formData.saleType === 'bandhi' && (
                <div className="form-section">
                  <div className="form-section-title">
                    <span>🤝</span>
                    <span>Contract Details</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">🤝 Select Contract *</label>
                    <select
                      className="form-select"
                      value={formData.contractId}
                      onChange={e => {
                        const contract = contracts.find(c => c._id === e.target.value);
                        setFormData({
                          ...formData, 
                          contractId: e.target.value,
                          ratePerLiter: contract?.ratePerLiter || formData.ratePerLiter
                        });
                      }}
                      required
                    >
                      <option value="">Choose a contract</option>
                      {contracts.map(contract => (
                        <option key={contract._id} value={contract._id}>
                          {contract.vendorName} - ₹{contract.ratePerLiter}/L
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">⏰ Time of Day *</label>
                    <select
                      className="form-select"
                      value={formData.timeOfDay}
                      onChange={e => setFormData({...formData, timeOfDay: e.target.value})}
                      required
                    >
                      <option value="">Select time</option>
                      <option value="morning">🌅 Morning</option>
                      <option value="evening">🌆 Evening</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Mandi specific fields */}
              {formData.saleType === 'mandi' && (
                <div className="form-section">
                  <div className="form-section-title">
                    <span>🏪</span>
                    <span>Market Details</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">⏰ Time of Day *</label>
                    <select
                      className="form-select"
                      value={formData.timeOfDay}
                      onChange={e => setFormData({...formData, timeOfDay: e.target.value})}
                      required
                    >
                      <option value="morning">🌅 Morning</option>
                      <option value="evening">🌆 Evening</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">💰 Rate per Liter (Committee decided) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.ratePerLiter}
                      onChange={e => setFormData({...formData, ratePerLiter: e.target.value})}
                      placeholder="Rate per liter"
                      required
                    />
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      Variable rate per 40 liters - Committee decides morning & evening rates
                    </small>
                  </div>
                </div>
              )}

              {/* Door-to-Door specific fields */}
              {formData.saleType === 'door_to_door' && (
                <div className="form-section">
                  <div className="form-section-title">
                    <span>🚪</span>
                    <span>Direct Sale Details</span>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">💰 Base Rate per Liter *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={formData.ratePerLiter}
                        onChange={e => setFormData({...formData, ratePerLiter: e.target.value})}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">📦 Packaging Cost per Liter</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={formData.packagingCost}
                        onChange={e => setFormData({...formData, packagingCost: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">👤 Customer Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.customerName}
                      onChange={e => setFormData({...formData, customerName: e.target.value})}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div className="info-box" style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)', border: '1px solid #0284c7', borderRadius: '0.5rem', padding: '1rem', margin: '1rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#0284c7', marginBottom: '0.5rem' }}>
                      <span>💰</span>
                      <span>Total Rate Calculation</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      ₹{(parseFloat(formData.ratePerLiter || 0) + parseFloat(formData.packagingCost || 0)).toFixed(2)}/L
                    </div>
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      Base Rate + Packaging Cost
                    </small>
                  </div>
                </div>
              )}

              {/* Additional Details */}
              <div className="form-section">
                <div className="form-section-title">
                  <span>📋</span>
                  <span>Additional Details</span>
                </div>
                {formData.saleType !== 'bandhi' && (
                  <div className="form-group">
                    <label className="form-label">👤 Customer Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.customerName}
                      onChange={e => setFormData({...formData, customerName: e.target.value})}
                      placeholder="Enter customer name"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">💳 Payment Status</label>
                  <select
                    className="form-select"
                    value={formData.paymentStatus}
                    onChange={e => setFormData({...formData, paymentStatus: e.target.value})}
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="received">✅ Received</option>
                    <option value="returned">↩️ Returned</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">📝 Notes</label>
                  <textarea
                    className="form-textarea"
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    rows="3"
                    placeholder="Add any additional notes..."
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">Record Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilkSales;
