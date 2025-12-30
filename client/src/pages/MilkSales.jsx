import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaMoneyBillWave, FaWallet, FaFilter, FaTimes, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './PageStyles.css';

const MilkSales = () => {
  const [sales, setSales] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [showPaymentAllocationModal, setShowPaymentAllocationModal] = useState(false);
  const [paymentAllocationData, setPaymentAllocationData] = useState({
    customerName: '',
    amount: '',
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0]
  });
  const [uniqueCustomers, setUniqueCustomers] = useState([]);
  const [paymentPreview, setPaymentPreview] = useState([]);
  const [customerFilter, setCustomerFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const customerInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Month/Year filter state
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

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
  }, [filterMonth, filterYear]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSales = async () => {
    try {
      // Calculate start and end dates for the selected month/year
      const startDate = new Date(filterYear, filterMonth, 1);
      const endDate = new Date(filterYear, filterMonth + 1, 0); // Last day of month

      const response = await api.get(`/milk/sales?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      const salesData = response.data.data || [];
      setSales(salesData);
      setSummary(response.data.summary || defaultSummary);

      // Extract unique customer names for payment allocation
      const customers = [...new Set(salesData
        .filter(sale => sale.customerName || sale.contractId?.vendorName)
        .map(sale => sale.customerName || sale.contractId?.vendorName)
      )];
      setUniqueCustomers(customers);

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
      // Check for duplicate sale on same date and type
      for (const x of sales) {
        if (x.date.substr(0, 10) === formData.date &&
          x.saleType === formData.saleType && (!formData.timeOfDay === formData.timeOfDay)
        ) {
          toast.error('A sale of this type already exists for the selected date');
          return;
        }
      }

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

  const handlePaymentAllocation = async (e) => {
    e.preventDefault();
    if (!paymentAllocationData.customerName || !paymentAllocationData.amount) {
      toast.error('Please fill customer name and amount');
      return;
    }
    try {
      const response = await api.post('/milk/sales/auto-allocate-payment', {
        customerName: paymentAllocationData.customerName,
        amount: Number(paymentAllocationData.amount),
        paymentMethod: paymentAllocationData.paymentMethod,
        date: paymentAllocationData.date
      });

      const { remainingAmount, data } = response.data;

      if (remainingAmount > 0) {
        toast.info(`Payment allocated to ${data.length} sale(s). Excess amount: Rs ${remainingAmount.toFixed(2)}`);
      } else {
        toast.success(`Payment of Rs ${paymentAllocationData.amount} allocated to ${data.length} sale(s)`);
      }

      setShowPaymentAllocationModal(false);
      setPaymentAllocationData({
        customerName: '',
        amount: '',
        paymentMethod: 'cash',
        date: new Date().toISOString().split('T')[0]
      });
      setPaymentPreview([]);
      fetchSales();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error allocating payment');
    }
  };

  // Get pending amount for a customer
  const getCustomerPendingAmount = (customerName) => {
    return sales
      .filter(sale =>
        (sale.customerName === customerName || sale.contractId?.vendorName === customerName) &&
        (sale.paymentStatus === 'pending' || sale.paymentStatus === 'partial')
      )
      .reduce((sum, sale) => sum + (sale.amountPending || sale.totalAmount), 0);
  };

  // Calculate payment preview when amount or customer changes
  const calculatePaymentPreview = (customerName, amount) => {
    if (!customerName || !amount || Number(amount) <= 0) {
      setPaymentPreview([]);
      return;
    }

    const pendingSales = sales
      .filter(sale =>
        (sale.customerName === customerName || sale.contractId?.vendorName === customerName) &&
        (sale.paymentStatus === 'pending' || sale.paymentStatus === 'partial')
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    let remainingAmount = Number(amount);
    const preview = [];

    for (const sale of pendingSales) {
      if (remainingAmount <= 0) break;

      const pendingForSale = sale.amountPending || sale.totalAmount;
      const amountToApply = Math.min(remainingAmount, pendingForSale);
      const remainingPending = pendingForSale - amountToApply;

      let newStatus = 'pending';
      if (amountToApply >= pendingForSale) {
        newStatus = 'received';
      } else if (amountToApply > 0) {
        newStatus = 'partial';
      }

      preview.push({
        _id: sale._id,
        date: sale.date,
        totalAmount: sale.totalAmount,
        previouslyPaid: sale.amountPaid || 0,
        currentPending: pendingForSale,
        amountToApply,
        remainingPending,
        newStatus
      });

      remainingAmount -= amountToApply;
    }

    // If there's remaining amount after all sales
    if (remainingAmount > 0) {
      preview.push({
        _id: 'excess',
        isExcess: true,
        excessAmount: remainingAmount
      });
    }

    setPaymentPreview(preview);
  };

  const handlePaymentAllocationChange = (field, value) => {
    const newData = { ...paymentAllocationData, [field]: value };
    setPaymentAllocationData(newData);

    if (field === 'customerName' || field === 'amount') {
      calculatePaymentPreview(
        field === 'customerName' ? value : paymentAllocationData.customerName,
        field === 'amount' ? value : paymentAllocationData.amount
      );
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
    setCustomerSearch('');
  };

  const handleSaleTypeChange = (type) => {
    setFormData({
      ...formData,
      saleType: type,
      ratePerLiter: type === 'bandhi' ? '182.5' : type === 'door_to_door' ? '220' : ''
    });
  };

  // Customer autocomplete filtered list
  const filteredCustomerList = uniqueCustomers.filter(customer =>
    customer.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const handleCustomerSelect = (customer) => {
    setFormData({ ...formData, customerName: customer });
    setCustomerSearch(customer);
    setShowCustomerDropdown(false);
  };

  const handleCustomerInputChange = (value) => {
    setCustomerSearch(value);
    setFormData({ ...formData, customerName: value });
    setShowCustomerDropdown(true);
  };

  // Filtered sales based on all filters
  const filteredSales = (sales || []).filter(sale => {
    // Sale type filter
    if (filterType !== 'all' && sale.saleType !== filterType) return false;

    // Customer filter
    if (customerFilter) {
      const saleCustomer = sale.customerName || sale.contractId?.vendorName || '';
      if (!saleCustomer.toLowerCase().includes(customerFilter.toLowerCase())) return false;
    }

    // Payment status filter
    if (paymentStatusFilter !== 'all' && sale.paymentStatus !== paymentStatusFilter) return false;

    return true;
  });

  if (loading) return <div className="container mt-3">Loading...</div>;

  return (
    <div className="container mt-3">
      <div className="page-header-mobile">
        <h1 className="page-title"><FaMoneyBillWave /> Milk Sales</h1>
        <div className="header-actions">
          <button className="btn btn-outline btn-success-outline" onClick={() => setShowPaymentAllocationModal(true)}>
            <FaWallet /> <span className="btn-text">Receive Payment</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FaPlus /> <span className="btn-text">Add Sale</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid mb-3">
        <div className="summary-card">
          <h4>Bandhi (Contract)</h4>
          <p className="summary-value primary">{summary.bandhi?.quantity || 0}L</p>
          <small>Rs {(summary.bandhi?.revenue || 0).toFixed(0)}</small>
        </div>
        <div className="summary-card">
          <h4>Mandi (Market)</h4>
          <p className="summary-value warning">{summary.mandi?.quantity || 0}L</p>
          <small>Rs {(summary.mandi?.revenue || 0).toFixed(0)}</small>
        </div>
        <div className="summary-card">
          <h4>Door-to-Door</h4>
          <p className="summary-value success">{summary.door_to_door?.quantity || 0}L</p>
          <small>Rs {(summary.door_to_door?.revenue || 0).toFixed(0)}</small>
        </div>
        <div className="summary-card">
          <h4>Total Revenue</h4>
          <p className="summary-value">Rs {(summary.totalRevenue || 0).toFixed(0)}</p>
          <small>Pending: Rs {(summary.pending || 0).toFixed(0)}</small>
        </div>
      </div>

      {/* Month/Year Filter Bar */}
      <div className="filters-section mb-3" style={{ justifyContent: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaCalendarAlt style={{ color: 'var(--primary-color)' }} />
          <select
            className="filter-select"
            value={filterMonth}
            onChange={(e) => setFilterMonth(parseInt(e.target.value))}
            style={{ minWidth: '80px' }}
          >
            {months.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
            style={{ minWidth: '80px' }}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section mb-3">
        {/* Sale Type Tabs */}
        <div className="filter-tabs">
          {['all', 'bandhi', 'mandi', 'door_to_door'].map(type => (
            <button
              key={type}
              className={`filter-tab ${filterType === type ? 'active' : ''}`}
              onClick={() => setFilterType(type)}
            >
              {type === 'all' ? 'All' : type === 'bandhi' ? 'Bandhi' : type === 'mandi' ? 'Mandi' : 'D2D'}
            </button>
          ))}
        </div>

        {/* Customer & Payment Status Filters */}
        <div className="filter-controls">
          <div className="filter-group">
            <FaSearch className="filter-icon" />
            <input
              type="text"
              className="filter-input"
              placeholder="Filter by customer..."
              value={customerFilter}
              onChange={e => setCustomerFilter(e.target.value)}
            />
            {customerFilter && (
              <button className="filter-clear" onClick={() => setCustomerFilter('')}>
                <FaTimes />
              </button>
            )}
          </div>
          <select
            className="filter-select"
            value={paymentStatusFilter}
            onChange={e => setPaymentStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="received">Received</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      {filteredSales.length > 0 ? (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Customer</th>
                <th className="hide-mobile">Time</th>
                <th className="text-right">Qty (L)</th>
                <th className="text-right hide-tablet">Rate</th>
                <th className="text-right">Total</th>
                <th className="text-right hide-tablet">Paid</th>
                <th className="text-right">Pending</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map(sale => (
                <tr key={sale._id}>
                  <td data-label="Date">{new Date(sale.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                  <td data-label="Type">
                    <span className={`badge badge-${sale.saleType}`}>
                      {sale.saleType === 'bandhi' ? '📋' : sale.saleType === 'mandi' ? '🏪' : '🚪'}
                    </span>
                  </td>
                  <td data-label="Customer">
                    {sale.contractId?.vendorName || sale.customerName || '-'}
                  </td>
                  <td data-label="Time" className="hide-mobile">
                    {(sale.saleType === 'mandi' || sale.saleType === 'bandhi') && sale.timeOfDay ? (
                      sale.timeOfDay === 'morning' ? '🌅' : '🌆'
                    ) : '-'}
                  </td>
                  <td data-label="Qty" className="text-right">{sale.quantity}</td>
                  <td data-label="Rate" className="text-right hide-tablet">Rs {sale.ratePerLiter?.toFixed(0)}</td>
                  <td data-label="Total" className="text-right"><strong>Rs {sale.totalAmount?.toFixed(0)}</strong></td>
                  <td data-label="Paid" className="text-right hide-tablet text-success">Rs {(sale.amountPaid || 0).toFixed(0)}</td>
                  <td data-label="Pending" className="text-right" style={{ color: sale.amountPending > 0 ? 'var(--danger-color)' : 'inherit' }}>
                    Rs {(sale.amountPending || 0).toFixed(0)}
                  </td>
                  <td data-label="Status">
                    <select
                      className={`status-select-compact ${sale.paymentStatus}`}
                      value={sale.paymentStatus}
                      onChange={(e) => updatePaymentStatus(sale._id, e.target.value)}
                    >
                      <option value="pending">⏳</option>
                      <option value="partial">◐</option>
                      <option value="received">✅</option>
                      <option value="returned">↩️</option>
                    </select>
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
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
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
                          {contract.vendorName} - Rs {contract.ratePerLiter}/L
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">⏰ Time of Day *</label>
                    <select
                      className="form-select"
                      value={formData.timeOfDay}
                      onChange={e => setFormData({ ...formData, timeOfDay: e.target.value })}
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
                      onChange={e => setFormData({ ...formData, timeOfDay: e.target.value })}
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
                      onChange={e => setFormData({ ...formData, ratePerLiter: e.target.value })}
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
                        onChange={e => setFormData({ ...formData, ratePerLiter: e.target.value })}
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
                        onChange={e => setFormData({ ...formData, packagingCost: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  {/* Customer with Autocomplete */}
                  <div className="form-group" ref={dropdownRef}>
                    <label className="form-label">👤 Customer Name</label>
                    <div className="autocomplete-wrapper">
                      <input
                        type="text"
                        className="form-input"
                        ref={customerInputRef}
                        value={customerSearch}
                        onChange={e => handleCustomerInputChange(e.target.value)}
                        onFocus={() => setShowCustomerDropdown(true)}
                        placeholder="Type or select customer name"
                      />
                      {showCustomerDropdown && (customerSearch || uniqueCustomers.length > 0) && (
                        <div className="autocomplete-dropdown">
                          {filteredCustomerList.length > 0 ? (
                            filteredCustomerList.map((customer, idx) => (
                              <div
                                key={idx}
                                className="autocomplete-item"
                                onClick={() => handleCustomerSelect(customer)}
                              >
                                {customer}
                              </div>
                            ))
                          ) : customerSearch && (
                            <div className="autocomplete-item new-customer" onClick={() => handleCustomerSelect(customerSearch)}>
                              <FaPlus size={12} /> Add "{customerSearch}" as new customer
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="info-box info-box-primary">
                    <div className="info-box-title">
                      <span>💰</span>
                      <span>Total Rate Calculation</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      Rs {(parseFloat(formData.ratePerLiter || 0) + parseFloat(formData.packagingCost || 0)).toFixed(2)}/L
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
                <div className="form-group">
                  <label className="form-label">📦 Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                {formData.saleType !== 'bandhi' && formData.saleType !== 'door_to_door' && (
                  <div className="form-group" ref={dropdownRef}>
                    <label className="form-label">👤 Customer Name</label>
                    <div className="autocomplete-wrapper">
                      <input
                        type="text"
                        className="form-input"
                        value={customerSearch}
                        onChange={e => handleCustomerInputChange(e.target.value)}
                        onFocus={() => setShowCustomerDropdown(true)}
                        placeholder="Type or select customer name"
                      />
                      {showCustomerDropdown && (customerSearch || uniqueCustomers.length > 0) && (
                        <div className="autocomplete-dropdown">
                          {filteredCustomerList.length > 0 ? (
                            filteredCustomerList.map((customer, idx) => (
                              <div
                                key={idx}
                                className="autocomplete-item"
                                onClick={() => handleCustomerSelect(customer)}
                              >
                                {customer}
                              </div>
                            ))
                          ) : customerSearch && (
                            <div className="autocomplete-item new-customer" onClick={() => handleCustomerSelect(customerSearch)}>
                              <FaPlus size={12} /> Add "{customerSearch}" as new customer
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">💳 Payment Status</label>
                  <select
                    className="form-select"
                    value={formData.paymentStatus}
                    onChange={e => setFormData({ ...formData, paymentStatus: e.target.value })}
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
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
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

      {/* Payment Allocation Modal */}
      {showPaymentAllocationModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentAllocationModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>💰 Receive Payment from Customer</h2>
              <button className="modal-close" onClick={() => setShowPaymentAllocationModal(false)}>&times;</button>
            </div>
            <form onSubmit={handlePaymentAllocation}>
              <div className="form-section">
                <div className="form-section-title">
                  <span>👤</span>
                  <span>Customer Details</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Customer/Vendor Name *</label>
                  <select
                    className="form-select"
                    value={paymentAllocationData.customerName}
                    onChange={e => handlePaymentAllocationChange('customerName', e.target.value)}
                    required
                  >
                    <option value="">Select a customer</option>
                    {uniqueCustomers.map(customer => {
                      const pendingAmount = getCustomerPendingAmount(customer);
                      return (
                        <option key={customer} value={customer}>
                          {customer} {pendingAmount > 0 ? `(Pending: Rs ${pendingAmount.toFixed(2)})` : '(No pending)'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {paymentAllocationData.customerName && (
                  <div className="info-box" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%)', border: '1px solid #f59e0b', borderRadius: '0.5rem', padding: '1rem', margin: '1rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#b45309', marginBottom: '0.5rem' }}>
                      <span>⏳</span>
                      <span>Pending Amount</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#b45309' }}>
                      Rs {getCustomerPendingAmount(paymentAllocationData.customerName).toFixed(2)}
                    </div>
                    <small style={{ color: '#92400e', fontSize: '0.75rem' }}>
                      This amount will be auto-allocated from oldest transactions first (FIFO)
                    </small>
                  </div>
                )}
              </div>

              <div className="form-section">
                <div className="form-section-title">
                  <span>💵</span>
                  <span>Payment Details</span>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Amount Received *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={paymentAllocationData.amount}
                      onChange={e => handlePaymentAllocationChange('amount', e.target.value)}
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-select"
                      value={paymentAllocationData.paymentMethod}
                      onChange={e => setPaymentAllocationData({ ...paymentAllocationData, paymentMethod: e.target.value })}
                    >
                      <option value="cash">💵 Cash</option>
                      <option value="bank_transfer">🏦 Bank Transfer</option>
                      <option value="cheque">📝 Cheque</option>
                      <option value="other">📦 Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={paymentAllocationData.date}
                    onChange={e => setPaymentAllocationData({ ...paymentAllocationData, date: e.target.value })}
                  />
                </div>
              </div>

              {/* Payment Allocation Preview */}
              {paymentPreview.length > 0 && (
                <div className="form-section">
                  <div className="form-section-title">
                    <span>📊</span>
                    <span>Payment Allocation Preview</span>
                  </div>
                  <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <table style={{ fontSize: '0.875rem' }}>
                      <thead>
                        <tr>
                          <th className="text-left">Sale Date</th>
                          <th className="text-right">Total</th>
                          <th className="text-right">Pending</th>
                          <th className="text-right">Applied</th>
                          <th className="text-right">Remaining</th>
                          <th className="text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentPreview.filter(p => !p.isExcess).map(preview => (
                          <tr key={preview._id}>
                            <td className="text-left">{new Date(preview.date).toLocaleDateString()}</td>
                            <td className="text-right">Rs {preview.totalAmount.toFixed(0)}</td>
                            <td className="text-right" style={{ color: 'var(--danger-color)' }}>Rs {preview.currentPending.toFixed(0)}</td>
                            <td className="text-right" style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>Rs {preview.amountToApply.toFixed(0)}</td>
                            <td className="text-right" style={{ color: preview.remainingPending > 0 ? 'var(--warning-color)' : 'var(--text-secondary)' }}>
                              Rs {preview.remainingPending.toFixed(0)}
                            </td>
                            <td className="text-center">
                              <span className={`status-badge ${preview.newStatus}`} style={{ fontSize: '0.75rem' }}>
                                {preview.newStatus === 'received' ? '✅ Paid' : preview.newStatus === 'partial' ? '⏳ Partial' : '❌ Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {paymentPreview.find(p => p.isExcess) && (
                    <div className="info-box" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)', border: '1px solid #3b82f6', borderRadius: '0.5rem', padding: '0.75rem', marginTop: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#1d4ed8' }}>
                        <span>💡</span>
                        <span>Excess Amount: Rs {paymentPreview.find(p => p.isExcess).excessAmount.toFixed(2)}</span>
                      </div>
                      <small style={{ color: '#1e40af', fontSize: '0.75rem' }}>
                        This amount exceeds all pending sales and will be credited in advance.
                      </small>
                    </div>
                  )}
                </div>
              )}

              <div className="info-box" style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)', border: '1px solid #10b981', borderRadius: '0.5rem', padding: '1rem', margin: '1rem 0' }}>
                <div style={{ fontWeight: '600', color: '#047857', marginBottom: '0.5rem' }}>
                  💡 How Payment Allocation Works
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#065f46', fontSize: '0.875rem' }}>
                  <li>Payment is allocated to the oldest pending transaction first</li>
                  <li>If payment exceeds transaction amount, remainder goes to next transaction</li>
                  <li>Transactions are marked as "Received" when fully paid</li>
                  <li>Partial payments update the transaction to "Partial" status</li>
                </ul>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowPaymentAllocationModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--success-color)' }}>
                  Allocate Payment
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
