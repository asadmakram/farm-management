import React, { useState } from 'react';
import { FaChartBar } from 'react-icons/fa';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './PageStyles.css';

const Reports = () => {
  const [reportType, setReportType] = useState('milk-yield');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    startDate: '',
    endDate: ''
  });

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
      }
      setReportData(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching report');
      setLoading(false);
    }
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
        </div>
      )}
    </div>
  );
};

export default Reports;
