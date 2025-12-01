import React, { useState, useEffect } from 'react';
import { FaChartBar, FaWhatsapp, FaDownload } from 'react-icons/fa';
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
    customerName: ''
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
        response = await api.get(`/reports/customer-sales-history?customerName=${encodeURIComponent(filters.customerName)}&startDate=${filters.startDate}&endDate=${filters.endDate}`);
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
      <h1 className="page-title"><FaChartBar /> Reports</h1>

      <div className="filter-section">
        <div className="form-group mb-2">
          <label className="form-label">Report Type</label>
          <select
            className="form-select"
            value={reportType}
            onChange={e => {
              setReportType(e.target.value);
              setReportData(null);
            }}
          >
            <option value="milk-yield">Monthly Milk Yield Report</option>
            <option value="profit-loss">Profit & Loss Report</option>
            <option value="animal-performance">Animal Performance Report</option>
            <option value="customer-sales-history">Customer Sales History</option>
          </select>
        </div>

        {reportType === 'milk-yield' ? (
          <div className="filter-row">
            <div className="form-group">
              <label className="form-label">Year</label>
              <input
                type="number"
                className="form-input"
                value={filters.year}
                onChange={e => setFilters({...filters, year: e.target.value})}
              />
            </div>
            <div className="form-group">
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
          <div className="filter-row">
            <div className="form-group">
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
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={filters.startDate}
                onChange={e => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            <div className="form-group">
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
        ) : (
          <div className="filter-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={filters.startDate}
                onChange={e => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            <div className="form-group">
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
            <div className="grid grid-4">
              <div className="card">
                <h4>Total Yield</h4>
                <p className="text-center" style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)'}}>
                  {Number(reportData.summary.totalYield || 0).toFixed(2)} L
                </p>
              </div>
              <div className="card">
                <h4>Total Revenue</h4>
                <p className="text-center" style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--secondary-color)'}}>
                  ₹{Number(reportData.summary.totalRevenue || 0).toFixed(2)}
                </p>
              </div>
              <div className="card">
                <h4>Total Expenses</h4>
                <p className="text-center" style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger-color)'}}>
                  ₹{Number(reportData.summary.totalExpenses || 0).toFixed(2)}
                </p>
              </div>
              <div className="card">
                <h4>Net Profit</h4>
                <p className="text-center" style={{fontSize: '2rem', fontWeight: 'bold', color: reportData.summary.profit >= 0 ? 'var(--secondary-color)' : 'var(--danger-color)'}}>
                  ₹{Number(reportData.summary.profit || 0).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {reportType === 'profit-loss' && reportData.profitLoss && (
            <div className="grid grid-3">
              <div className="card">
                <h4>Total Revenue</h4>
                <p className="text-center" style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--secondary-color)'}}>
                  ₹{Number(reportData.revenue.total || 0).toFixed(2)}
                </p>
              </div>
              <div className="card">
                <h4>Total Expenses</h4>
                <p className="text-center" style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger-color)'}}>
                  ₹{Number(reportData.expenses.total || 0).toFixed(2)}
                </p>
              </div>
              <div className="card">
                <h4>Net {reportData.profitLoss.status === 'profit' ? 'Profit' : 'Loss'}</h4>
                <p className="text-center" style={{fontSize: '2rem', fontWeight: 'bold', color: reportData.profitLoss.status === 'profit' ? 'var(--secondary-color)' : 'var(--danger-color)'}}>
                  ₹{Number(Math.abs(reportData.profitLoss.netProfit || 0)).toFixed(2)}
                </p>
                <p className="text-center">Margin: {reportData.profitLoss.profitMargin}%</p>
              </div>
            </div>
          )}
          
          {reportType === 'customer-sales-history' && reportData && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Sales History for {reportData.customerName}</h3>
                <button 
                  className="btn btn-success" 
                  onClick={shareOnWhatsApp}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <FaWhatsapp /> Share on WhatsApp
                </button>
              </div>

              <div className="grid grid-4">
                <div className="card">
                  <h4>Total Sales</h4>
                  <p className="text-center" style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)'}}>
                    {reportData.summary.totalSales}
                  </p>
                </div>
                <div className="card">
                  <h4>Total Quantity</h4>
                  <p className="text-center" style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--secondary-color)'}}>
                    {reportData.summary.totalQuantity} L
                  </p>
                </div>
                <div className="card">
                  <h4>Total Amount</h4>
                  <p className="text-center" style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)'}}>
                    Rs {reportData.summary.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div className="card">
                  <h4>Average Rate</h4>
                  <p className="text-center" style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--secondary-color)'}}>
                    Rs {reportData.summary.averageRate}/L
                  </p>
                </div>
              </div>

              <div className="grid grid-3" style={{marginTop: '20px'}}>
                <div className="card">
                  <h4>Amount Paid</h4>
                  <p className="text-center" style={{fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--secondary-color)'}}>
                    Rs {reportData.summary.totalPaid.toFixed(2)}
                  </p>
                </div>
                <div className="card">
                  <h4>Amount Pending</h4>
                  <p className="text-center" style={{fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--danger-color)'}}>
                    Rs {reportData.summary.totalPending.toFixed(2)}
                  </p>
                </div>
                <div className="card">
                  <h4>Payment Status</h4>
                  <p className="text-center" style={{fontSize: '1.8rem', fontWeight: 'bold', color: reportData.summary.totalPending === 0 ? 'var(--secondary-color)' : 'var(--warning-color)'}}>
                    {reportData.summary.totalPending === 0 ? 'Fully Paid' : 'Partially Paid'}
                  </p>
                </div>
              </div>

              <div className="card" style={{marginTop: '20px'}}>
                <h3>Daily Sales Breakdown</h3>
                <div style={{overflowX: 'auto'}}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Morning (L)</th>
                        <th>Evening (L)</th>
                        <th>Total Qty (L)</th>
                        <th>Amount</th>
                        <th>Paid</th>
                        <th>Pending</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.salesByDate.map((day, index) => (
                        <tr key={index}>
                          <td>{new Date(day.date).toLocaleDateString()}</td>
                          <td>
                            {day.morning.count > 0 ? (
                              <span>
                                {day.morning.quantity.toFixed(1)} L<br/>
                                <small style={{color: '#666'}}>@ Rs {day.morning.rate}/L</small>
                              </span>
                            ) : '-'}
                          </td>
                          <td>
                            {day.evening.count > 0 ? (
                              <span>
                                {day.evening.quantity.toFixed(1)} L<br/>
                                <small style={{color: '#666'}}>@ Rs {day.evening.rate}/L</small>
                              </span>
                            ) : '-'}
                          </td>
                          <td><strong>{day.totalQuantity.toFixed(1)}</strong></td>
                          <td><strong>Rs {day.totalAmount.toFixed(2)}</strong></td>
                          <td style={{color: 'var(--secondary-color)'}}>Rs {day.amountPaid.toFixed(2)}</td>
                          <td style={{color: 'var(--danger-color)'}}>Rs {day.amountPending.toFixed(2)}</td>
                          <td>
                            <span className={`badge ${day.amountPending === 0 ? 'badge-success' : day.amountPaid > 0 ? 'badge-warning' : 'badge-danger'}`}>
                              {day.amountPending === 0 ? 'Paid' : day.amountPaid > 0 ? 'Partial' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{fontWeight: 'bold', backgroundColor: '#f8f9fa'}}>
                        <td colSpan="3">Total</td>
                        <td>{reportData.summary.totalQuantity.toFixed(1)} L</td>
                        <td>Rs {reportData.summary.totalAmount.toFixed(2)}</td>
                        <td style={{color: 'var(--secondary-color)'}}>Rs {reportData.summary.totalPaid.toFixed(2)}</td>
                        <td style={{color: 'var(--danger-color)'}}>Rs {reportData.summary.totalPending.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
