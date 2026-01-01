import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../pages/FeedStyles.css';

const FeedOrders = () => {
  const { user } = useAuth();
  const [feedOrders, setFeedOrders] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('create');
  
  // Form state
  const [selectedFeedItems, setSelectedFeedItems] = useState([]);
  const [numberOfAnimals, setNumberOfAnimals] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, itemsRes] = await Promise.all([
        api.get('/feed-orders'),
        api.get('/feed-items')
      ]);
      setFeedOrders(ordersRes.data);
      setFeedItems(itemsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeedItem = () => {
    setSelectedFeedItems([...selectedFeedItems, {
      feedItemId: '',
      quantityPerTime: '',
      numberOfTimesPerDay: 2
    }]);
  };

  const handleRemoveFeedItem = (index) => {
    setSelectedFeedItems(selectedFeedItems.filter((_, i) => i !== index));
    setPreview(null);
  };

  const handleFeedItemChange = (index, field, value) => {
    const updated = [...selectedFeedItems];
    updated[index][field] = value;
    setSelectedFeedItems(updated);
  };

  const calculatePreview = async () => {
    try {
      if (!numberOfAnimals || !startDate || !endDate || selectedFeedItems.length === 0) {
        setError('Please fill in all required fields');
        return;
      }

      if (new Date(endDate) <= new Date(startDate)) {
        setError('End date must be after start date');
        return;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      // Calculate requirements locally
      let totalQuantity = 0;
      let totalBags = 0;
      let totalCost = 0;
      const details = [];

      for (const item of selectedFeedItems) {
        const feedItem = feedItems.find(f => f._id === item.feedItemId);
        if (!feedItem) continue;

        const dailyQuantity = item.quantityPerTime * item.numberOfTimesPerDay * numberOfAnimals;
        const periodQuantity = dailyQuantity * numberOfDays;
        const bagsRequired = Math.ceil(periodQuantity / feedItem.quantityPerBag);
        const itemCost = bagsRequired * feedItem.pricePerBag;

        totalQuantity += periodQuantity;
        totalBags += bagsRequired;
        totalCost += itemCost;

        details.push({
          itemName: feedItem.name,
          quantityRequired: parseFloat(periodQuantity.toFixed(2)),
          bagsRequired,
          costRequired: parseFloat(itemCost.toFixed(2))
        });
      }

      setPreview({
        numberOfDays,
        totalQuantityRequired: parseFloat(totalQuantity.toFixed(2)),
        bagsRequired: totalBags,
        totalCost: parseFloat(totalCost.toFixed(2)),
        details
      });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      if (!preview) {
        setError('Please preview the order first');
        return;
      }

      const orderData = {
        feedItems: selectedFeedItems,
        numberOfAnimals: parseInt(numberOfAnimals),
        startDate,
        endDate,
        supplierPhone,
        notes
      };

      const response = await api.post('/feed-orders', orderData);
      setFeedOrders([response.data, ...feedOrders]);
      
      // Reset form
      setSelectedFeedItems([]);
      setNumberOfAnimals('');
      setStartDate('');
      setEndDate('');
      setSupplierPhone('');
      setNotes('');
      setPreview(null);
      setError(null);
      setActiveTab('orders');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleSendWhatsApp = async (orderId) => {
    try {
      const response = await api.post(`/feed-orders/${orderId}/send-whatsapp`);
      window.open(response.data.whatsappLink, '_blank');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleConfirmDelivery = async (orderId) => {
    try {
      await api.post(`/feed-orders/${orderId}/confirm-delivery`, {});
      fetchData();
      setSelectedOrder(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleStartFeeding = async (orderId) => {
    try {
      await api.post(`/feed-orders/${orderId}/start-feeding`, {});
      fetchData();
      setSelectedOrder(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleRecordPayment = async (orderId) => {
    try {
      if (!paymentAmount || paymentAmount <= 0) {
        setError('Payment amount must be greater than 0');
        return;
      }

      await api.post(`/feed-orders/${orderId}/record-payment`, {
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        notes: paymentNotes
      });
      
      setPaymentAmount('');
      setPaymentMethod('CASH');
      setPaymentNotes('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      DRAFT: '#999',
      ORDERED: '#ffc107',
      DELIVERED: '#17a2b8',
      ACTIVE: '#28a745',
      COMPLETED: '#6c757d',
      CANCELLED: '#dc3545'
    };
    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '20px',
        backgroundColor: colors[status],
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {status}
      </span>
    );
  };

  const getPaymentBadge = (status) => {
    const colors = {
      PENDING: '#999',
      PARTIAL_PAID: '#ffc107',
      PAID: '#28a745',
      CASH: '#17a2b8',
      CREDIT: '#fd7e14'
    };
    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '20px',
        backgroundColor: colors[status],
        color: 'white',
        fontSize: '11px',
        fontWeight: 'bold'
      }}>
        {status}
      </span>
    );
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-container">
      <h1>Feed Orders</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Order
        </button>
        <button
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          All Orders
        </button>
      </div>

      {/* Create Order Tab */}
      {activeTab === 'create' && (
        <>
          <div className="section">
            <h2>New Feed Order</h2>
            <form onSubmit={handleCreateOrder} className="feed-item-form">
              
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Number of Animals *</label>
                  <input
                    type="number"
                    value={numberOfAnimals}
                    onChange={(e) => setNumberOfAnimals(e.target.value)}
                    placeholder="e.g., 50"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Feed Items *</label>
                {selectedFeedItems.length === 0 ? (
                  <p style={{ color: '#999', fontSize: '14px' }}>No feed items selected. Click "Add Feed Item" below.</p>
                ) : (
                  selectedFeedItems.map((item, index) => (
                    <div key={index} style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Feed Item</label>
                          <select
                            value={item.feedItemId}
                            onChange={(e) => handleFeedItemChange(index, 'feedItemId', e.target.value)}
                            required
                          >
                            <option value="">Select a feed item</option>
                            {feedItems.map(f => (
                              <option key={f._id} value={f._id}>{f.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Qty per Time (kg)</label>
                          <input
                            type="number"
                            value={item.quantityPerTime}
                            onChange={(e) => handleFeedItemChange(index, 'quantityPerTime', e.target.value)}
                            step="0.1"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Times per Day</label>
                          <input
                            type="number"
                            value={item.numberOfTimesPerDay}
                            onChange={(e) => handleFeedItemChange(index, 'numberOfTimesPerDay', e.target.value)}
                            min="1"
                            max="10"
                            required
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeedItem(index)}
                            className="btn btn-sm btn-danger"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <button
                  type="button"
                  onClick={handleAddFeedItem}
                  className="btn btn-sm btn-secondary"
                  style={{ marginTop: '10px' }}
                >
                  + Add Feed Item
                </button>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Supplier Phone (WhatsApp)</label>
                  <input
                    type="tel"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    placeholder="e.g., +923001234567"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any special instructions or notes..."
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={calculatePreview} className="btn btn-info">
                  Preview Order
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Order
                </button>
              </div>
            </form>
          </div>

          {/* Preview */}
          {preview && (
            <div className="section preview-section">
              <h2>Order Preview</h2>
              <div className="preview-grid">
                <div className="preview-item">
                  <h4>Duration</h4>
                  <p className="amount">{preview.numberOfDays} days</p>
                </div>
                <div className="preview-item">
                  <h4>Total Quantity</h4>
                  <p className="amount">{preview.totalQuantityRequired} kg</p>
                </div>
                <div className="preview-item">
                  <h4>Total Bags</h4>
                  <p className="amount">{preview.bagsRequired} bags</p>
                </div>
                <div className="preview-item">
                  <h4>Total Cost</h4>
                  <p className="amount">PKR {preview.totalCost.toFixed(0)}</p>
                </div>
              </div>
              
              <h3 style={{ marginTop: '20px' }}>Item Breakdown</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty (kg)</th>
                    <th>Bags</th>
                    <th>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.details.map((detail, idx) => (
                    <tr key={idx}>
                      <td>{detail.itemName}</td>
                      <td>{detail.quantityRequired}</td>
                      <td>{detail.bagsRequired}</td>
                      <td>PKR {detail.costRequired}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Orders List Tab */}
      {activeTab === 'orders' && (
        <div className="section">
          <h2>Feed Orders</h2>
          {feedOrders.length === 0 ? (
            <p className="text-muted">No orders yet</p>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {feedOrders.map(order => (
                <div key={order._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0' }}>
                        {new Date(order.startDate).toLocaleDateString()} - {new Date(order.endDate).toLocaleDateString()}
                      </h4>
                      <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                        {order.numberOfDays} days | {order.numberOfAnimals} animals
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', alignItems: 'flex-end' }}>
                      {getStatusBadge(order.status)}
                      {getPaymentBadge(order.paymentStatus)}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Total Quantity</p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: 'bold' }}>{order.totalQuantityRequired} kg</p>
                    </div>
                    <div>
                      <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Bags Required</p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: 'bold' }}>{order.bagsRequired}</p>
                    </div>
                    <div>
                      <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Total Cost</p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: 'bold' }}>PKR {order.totalCost}</p>
                    </div>
                    <div>
                      <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Paid</p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>PKR {order.amountPaid || 0}</p>
                    </div>
                    <div>
                      <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Due</p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: '#dc3545' }}>PKR {order.amountDue || order.totalCost}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
                    {order.status === 'DRAFT' && (
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="btn btn-sm btn-primary"
                      >
                        View & Edit
                      </button>
                    )}
                    {order.status === 'DRAFT' && order.supplierPhone && (
                      <button
                        onClick={() => handleSendWhatsApp(order._id)}
                        className="btn btn-sm btn-info"
                      >
                        📱 Order via WhatsApp
                      </button>
                    )}
                    {order.status === 'ORDERED' && (
                      <button
                        onClick={() => handleConfirmDelivery(order._id)}
                        className="btn btn-sm btn-success"
                      >
                        ✓ Confirm Delivery
                      </button>
                    )}
                    {order.status === 'DELIVERED' && (
                      <button
                        onClick={() => handleStartFeeding(order._id)}
                        className="btn btn-sm btn-success"
                      >
                        ▶ Start Feeding
                      </button>
                    )}
                    {order.paymentStatus !== 'PAID' && (order.status === 'ORDERED' || order.status === 'DELIVERED' || order.status === 'ACTIVE') && (
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="btn btn-sm btn-warning"
                      >
                        💳 Record Payment
                      </button>
                    )}
                  </div>

                  {order.notes && (
                    <p style={{ margin: '0', fontSize: '13px', color: '#666', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                      <strong>Notes:</strong> {order.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setSelectedOrder(null)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <h2>Record Payment</h2>
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Total Cost</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: 'bold' }}>PKR {selectedOrder.totalCost}</p>
                </div>
                <div>
                  <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Already Paid</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>PKR {selectedOrder.amountPaid || 0}</p>
                </div>
                <div>
                  <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Still Due</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: 'bold', color: '#dc3545' }}>PKR {selectedOrder.amountDue || selectedOrder.totalCost}</p>
                </div>
                <div>
                  <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Status</p>
                  <p style={{ margin: '5px 0 0 0' }}>{getPaymentBadge(selectedOrder.paymentStatus)}</p>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Amount to Pay (PKR) *</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
                step="0.01"
                min="0"
                max={selectedOrder.amountDue || selectedOrder.totalCost}
              />
            </div>

            <div className="form-group">
              <label>Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="ONLINE">Online</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>

            <div className="form-group">
              <label>Payment Notes</label>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Add any notes about this payment..."
                rows="3"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleRecordPayment(selectedOrder._id)}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                💳 Record Payment
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>

            {selectedOrder.paymentHistory && selectedOrder.paymentHistory.length > 0 && (
              <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <h3>Payment History</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.paymentHistory.map((payment, idx) => (
                      <tr key={idx}>
                        <td>{new Date(payment.paidAt).toLocaleDateString()}</td>
                        <td>PKR {payment.amount}</td>
                        <td>{payment.method}</td>
                        <td>{payment.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedOrders;
