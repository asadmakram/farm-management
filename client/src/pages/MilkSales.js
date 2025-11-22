import React, { useState, useEffect } from 'react';
import { FaPlus, FaMoneyBillWave } from 'react-icons/fa';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './PageStyles.css';

const MilkSales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    customerType: 'contractor',
    customerName: '',
    ratePerLiter: '',
    paymentStatus: 'pending',
    notes: ''
  });

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await api.get('/milk/sales');
      setSales(response.data.data);
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching sales');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/milk/sales', {
        ...formData,
        quantity: Number(formData.quantity || 0),
        ratePerLiter: Number(formData.ratePerLiter || 0)
      });
      toast.success('Milk sale recorded successfully');
      fetchSales();
      setShowModal(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        quantity: '',
        customerType: 'contractor',
        customerName: '',
        ratePerLiter: '',
        paymentStatus: 'pending',
        notes: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving sale');
    }
  };

  if (loading) return <div className="container mt-3">Loading...</div>;

  return (
    <div className="container mt-3">
      <div className="flex-between mb-3">
        <h1 className="page-title"><FaMoneyBillWave /> Milk Sales</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Add Sale
        </button>
      </div>

      {sales.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Quantity (L)</th>
                <th>Rate/L</th>
                <th>Total</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale._id}>
                  <td data-label="Date">{new Date(sale.date).toLocaleDateString()}</td>
                  <td data-label="Customer">{sale.customerName || 'N/A'}</td>
                  <td data-label="Type"><span className="status-badge">{sale.customerType}</span></td>
                  <td data-label="Quantity">{sale.quantity}</td>
                  <td data-label="Rate">₹{sale.ratePerLiter}</td>
                  <td data-label="Total"><strong>₹{Number(sale.totalAmount || 0).toFixed(2)}</strong></td>
                  <td data-label="Payment"><span className={`status-badge ${sale.paymentStatus}`}>{sale.paymentStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <FaMoneyBillWave size={48} />
          <p>No sales recorded yet</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FaPlus /> Record First Sale
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Milk Sale</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity (L) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rate per Liter *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.ratePerLiter}
                    onChange={e => setFormData({...formData, ratePerLiter: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Customer Type *</label>
                  <select
                    className="form-select"
                    value={formData.customerType}
                    onChange={e => setFormData({...formData, customerType: e.target.value})}
                    required
                  >
                    <option value="contractor">Contractor</option>
                    <option value="individual">Individual</option>
                    <option value="retail">Retail</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.customerName}
                    onChange={e => setFormData({...formData, customerName: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Status</label>
                <select
                  className="form-select"
                  value={formData.paymentStatus}
                  onChange={e => setFormData({...formData, paymentStatus: e.target.value})}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
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
                <button type="submit" className="btn btn-primary">
                  Record Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilkSales;
