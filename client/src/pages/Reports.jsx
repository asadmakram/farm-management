import React, { useState, useEffect } from 'react';
import { FaChartBar, FaWhatsapp, FaDownload, FaTint, FaMoneyBillWave, FaBalanceScale, FaUsers } from 'react-icons/fa';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './PageStyles.css';

const Reports = () => {
  const [reportType, setReportType] = useState('milk-yield');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    startDate: '',
    endDate: '',
    customerName: '',
    paymentStatus: 'all'
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const [salesRes, contractsRes] = await Promise.all([
        api.get('/milk/sales'),
        api.get('/contracts?status=active')
      ]);
      const salesData = salesRes.data.data || [];
      const customerNames = [...new Set(salesData
        .filter(sale => sale.customerName || sale.contractId?.vendorName)
        .map(sale => sale.customerName || sale.contractId?.vendorName)
      )];
      setCustomers(customerNames.sort());
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      let response;
      if (reportType === 'milk-yield') {
        response = await api.get(`/reports/milk-yield?year=${filters.year}&month=${filters.month}`);
      } else if (reportType === 'profit-loss') {
        if (!filters.startDate || !filters.endDate) {
          toast.error('Please select start and end dates');
          setLoading(false);
          return;
        }
        response = await api.get(`/reports/profit-loss?startDate=${filters.startDate}&endDate=${filters.endDate}`);
      } else if (reportType === 'animal-performance') {
        if (!filters.startDate || !filters.endDate) {
          toast.error('Please select start and end dates');
          setLoading(false);
          return;
        }
        response = await api.get(`/reports/animal-performance?startDate=${filters.startDate}&endDate=${filters.endDate}`);
      } else if (reportType === 'customer-sales-history') {
        if (!filters.customerName) {
          toast.error('Please select a customer');
          setLoading(false);
          return;
        }
        if (!filters.startDate || !filters.endDate) {
          toast.error('Please select start and end dates');
          setLoading(false);
          return;
        }
        const paymentStatusParam = filters.paymentStatus !== 'all' ? `&paymentStatus=${filters.paymentStatus}` : '';
        response = await api.get(`/reports/customer-sales-history?customerName=${encodeURIComponent(filters.customerName)}&startDate=${filters.startDate}&endDate=${filters.endDate}${paymentStatusParam}`);
      }
      setReportData(response.data);
      setLoading(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error fetching report');
      setLoading(false);
    }
  };

  const shareOnWhatsApp = () => {
    if (!reportData || reportType !== 'customer-sales-history') return;

    let message = `*Sales Report for ${reportData.customerName}*\n`;
    message += `Period: ${new Date(reportData.period.startDate).toLocaleDateString()} to ${new Date(reportData.period.endDate).toLocaleDateString()}\n\n`;
    message += `*Summary:*\n`;
    message += `Total Sales: ${reportData.summary.totalSales}\n`;
    message += `Total Quantity: ${reportData.summary.totalQuantity} L\n`;
    message += `Total Amount: Rs ${reportData.summary.totalAmount}\n`;
    message += `Amount Paid: Rs ${reportData.summary.totalPaid}\n`;
    message += `Amount Pending: Rs ${reportData.summary.totalPending}\n`;
    message += `Average Rate: Rs ${reportData.summary.averageRate}/L\n\n`;
    message += `*Daily Breakdown:*\n`;
    
    reportData.salesByDate.forEach(day => {
      message += `\n📅 *${new Date(day.date).toLocaleDateString()}*\n`;
      if (day.morning.count > 0) {
        message += `  🌅 Morning: ${day.morning.quantity}L @ Rs ${day.morning.rate}/L = Rs ${day.morning.amount.toFixed(2)}\n`;
      }
      if (day.evening.count > 0) {
        message += `  🌆 Evening: ${day.evening.quantity}L @ Rs ${day.evening.rate}/L = Rs ${day.evening.amount.toFixed(2)}\n`;
      }
      if (day.allDay.count > 0) {
        message += `  📦 Total: ${day.allDay.quantity}L @ Rs ${day.allDay.rate}/L = Rs ${day.allDay.amount.toFixed(2)}\n`;
      }
      message += `  💰 Day Total: ${day.totalQuantity}L = Rs ${day.totalAmount.toFixed(2)}\n`;
      message += `  ✅ Paid: Rs ${day.amountPaid.toFixed(2)} | ⏳ Pending: Rs ${day.amountPending.toFixed(2)}\n`;
    });

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="container mt-3">
      <div className="page-header-mobile">
        <h1 className="page-title"><FaChartBar /> Reports</h1>
      </div>

      {/* Report Type Selector */}
      <div className="filters-section" style={{ marginBottom: '1rem' }}>
        <div className="filter-tabs" style={{ width: '100%', flexWrap: 'wrap' }}>
          <button 
            className={`filter-tab ${reportType === 'milk-yield' ? 'active' : ''}`}
            onClick={() => { setReportType('milk-yield'); setReportData(null); }}
          >
            <FaTint className="hide-mobile" /> Milk Yield
          </button>
          <button 
            className={`filter-tab ${reportType === 'profit-loss' ? 'active' : ''}`}
            onClick={() => { setReportType('profit-loss'); setReportData(null); }}
          >
            <FaBalanceScale className="hide-mobile" /> Profit/Loss
          </button>
          <button 
            className={`filter-tab ${reportType === 'animal-performance' ? 'active' : ''}`}
            onClick={() => { setReportType('animal-performance'); setReportData(null); }}
          >
            <FaChartBar className="hide-mobile" /> Performance
          </button>
          <button 
            className={`filter-tab ${reportType === 'customer-sales-history' ? 'active' : ''}`}
            onClick={() => { setReportType('customer-sales-history'); setReportData(null); }}
          >
            <FaUsers className="hide-mobile" /> Customer History
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        {reportType === 'milk-yield' ? (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: '1', minWidth: '120px' }}>
              <label className="form-label">Year</label>
              <input
                type="number"
                className="form-input"
                value={filters.year}
                onChange={e => setFilters({...filters, year: e.target.value})}
              />
            </div>
            <div className="form-group" style={{ flex: '1', minWidth: '120px' }}>
              <label className="form-label">Month</label>
              <select
                className="form-select"
                value={filters.month}
                onChange={e => setFilters({...filters, month: e.target.value})}
              >
                {Array.from({length: 12}, (_, i) => (
                  <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={fetchReport} disabled={loading}>
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
        ) : reportType === 'customer-sales-history' ? (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: '1', minWidth: '150px' }}>
              <label className="form-label">Customer</label>
              <select
                className="form-select"
                value={filters.customerName}
                onChange={e => setFilters({...filters, customerName: e.target.value})}
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer} value={customer}>{customer}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: '1', minWidth: '120px' }}>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={filters.startDate}
                onChange={e => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            <div className="form-group" style={{ flex: '1', minWidth: '120px' }}>
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={filters.endDate}
                onChange={e => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
            <div className="form-group" style={{ flex: '1', minWidth: '120px' }}>
              <label className="form-label">Payment Status</label>
              <select
                className="form-select"
                value={filters.paymentStatus}
                onChange={e => setFilters({...filters, paymentStatus: e.target.value})}
              >
                <option value="all">All</option>
                <option value="received">Received</option>
                <option value="partial">Partial</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={fetchReport} disabled={loading}>
              {loading ? 'Loading...' : 'Generate'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: '1', minWidth: '120px' }}>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={filters.startDate}
                onChange={e => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            <div className="form-group" style={{ flex: '1', minWidth: '120px' }}>
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={filters.endDate}
                onChange={e => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
            <button className="btn btn-primary" onClick={fetchReport} disabled={loading}>
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
        )}
      </div>

      {reportData && (
        <div className="mt-3">
          {reportType === 'milk-yield' && reportData.summary && (
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-icon" style={{ background: 'var(--primary-color)' }}>
                  <FaTint />
                </div>
                <div className="summary-content">
                  <span className="summary-label">Total Yield</span>
                  <span className="summary-value">{Number(reportData.summary.totalYield || 0).toFixed(0)} L</span>
                  <span className="summary-sub">This month</span>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon" style={{ background: 'var(--success-color)' }}>
                  <FaMoneyBillWave />
                </div>
                <div className="summary-content">
                  <span className="summary-label">Revenue</span>
                  <span className="summary-value">Rs {Number(reportData.summary.totalRevenue || 0).toLocaleString()}</span>
                  <span className="summary-sub">Total sales</span>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon" style={{ background: reportData.summary.profit >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                  <FaBalanceScale />
                </div>
                <div className="summary-content">
                  <span className="summary-label">Net Profit</span>
                  <span className="summary-value">Rs {Number(reportData.summary.profit || 0).toLocaleString()}</span>
                  <span className="summary-sub">{reportData.summary.profit >= 0 ? 'Profit' : 'Loss'}</span>
                </div>
              </div>
            </div>
          )}

          {reportType === 'profit-loss' && reportData.profitLoss && (
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-icon" style={{ background: 'var(--success-color)' }}>
                  <FaMoneyBillWave />
                </div>
                <div className="summary-content">
                  <span className="summary-label">Total Revenue</span>
                  <span className="summary-value">Rs {Number(reportData.revenue.total || 0).toLocaleString()}</span>
                  <span className="summary-sub">Income</span>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon" style={{ background: 'var(--danger-color)' }}>
                  <FaMoneyBillWave />
                </div>
                <div className="summary-content">
                  <span className="summary-label">Total Expenses</span>
                  <span className="summary-value">Rs {Number(reportData.expenses.total || 0).toLocaleString()}</span>
                  <span className="summary-sub">Outgoing</span>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon" style={{ background: reportData.profitLoss.status === 'profit' ? 'var(--success-color)' : 'var(--danger-color)' }}>
                  <FaBalanceScale />
                </div>
                <div className="summary-content">
                  <span className="summary-label">Net {reportData.profitLoss.status === 'profit' ? 'Profit' : 'Loss'}</span>
                  <span className="summary-value">Rs {Number(Math.abs(reportData.profitLoss.netProfit || 0)).toLocaleString()}</span>
                  <span className="summary-sub">Margin: {reportData.profitLoss.profitMargin}%</span>
                </div>
              </div>
            </div>
          )}
          
          {reportType === 'customer-sales-history' && reportData && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ margin: 0 }}>Sales: {reportData.customerName}</h3>
                <button 
                  className="btn btn-success" 
                  onClick={shareOnWhatsApp}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <FaWhatsapp /> <span className="hide-mobile">Share on WhatsApp</span>
                </button>
              </div>

              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-icon" style={{ background: 'var(--primary-color)' }}>
                    <FaTint />
                  </div>
                  <div className="summary-content">
                    <span className="summary-label">Total Quantity</span>
                    <span className="summary-value">{reportData.summary.totalQuantity} L</span>
                    <span className="summary-sub">{reportData.summary.totalSales} sales</span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon" style={{ background: 'var(--success-color)' }}>
                    <FaMoneyBillWave />
                  </div>
                  <div className="summary-content">
                    <span className="summary-label">Paid</span>
                    <span className="summary-value">Rs {reportData.summary.totalPaid.toLocaleString()}</span>
                    <span className="summary-sub">Received</span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon" style={{ background: 'var(--danger-color)' }}>
                    <FaMoneyBillWave />
                  </div>
                  <div className="summary-content">
                    <span className="summary-label">Pending</span>
                    <span className="summary-value">Rs {reportData.summary.totalPending.toLocaleString()}</span>
                    <span className="summary-sub">Outstanding</span>
                  </div>
                </div>
              </div>

              {/* Total Card */}
              <div className="card" style={{ marginBottom: '1rem', padding: '1rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1rem', opacity: 0.9 }}>Total Amount (Avg Rs {reportData.summary.averageRate}/L)</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Rs {reportData.summary.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="hide-mobile">Morning</th>
                      <th className="hide-mobile">Evening</th>
                      <th>Qty (L)</th>
                      <th>Amount</th>
                      <th className="hide-tablet">Paid</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.salesByDate.map((day, index) => (
                      <tr key={index}>
                        <td>{new Date(day.date).toLocaleDateString()}</td>
                        <td className="hide-mobile">
                          {day.morning.count > 0 ? `${day.morning.quantity.toFixed(1)} L` : '-'}
                        </td>
                        <td className="hide-mobile">
                          {day.evening.count > 0 ? `${day.evening.quantity.toFixed(1)} L` : '-'}
                        </td>
                        <td><strong>{day.totalQuantity.toFixed(1)}</strong></td>
                        <td><strong>Rs {day.totalAmount.toLocaleString()}</strong></td>
                        <td className="hide-tablet" style={{ color: 'var(--success-color)' }}>Rs {day.amountPaid.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${day.amountPending === 0 ? 'badge-success' : day.amountPaid > 0 ? 'badge-warning' : 'badge-danger'}`}>
                            {day.amountPending === 0 ? 'Paid' : day.amountPaid > 0 ? 'Partial' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {!reportData && !loading && (
        <div className="empty-state">
          <FaChartBar size={48} />
          <p>Select report type and filters, then generate report</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
