import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaTint, FaMoneyBillWave, FaChartLine, FaCalendarAlt } from 'react-icons/fa';
import { GiCow } from 'react-icons/gi';
import api from '../utils/api';
import './Dashboard.css';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterInfo, setFilterInfo] = useState(null);

  // Generate month options
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Generate year options (last 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchDashboardData();
  }, [filterMonth, filterYear]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/dashboard?month=${filterMonth}&year=${filterYear}`);
      setDashboardData(response.data.dashboard);
      setFilterInfo(response.data.filter);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mt-3">Loading dashboard...</div>;
  }

  if (!dashboardData) {
    return <div className="container mt-3">No data available</div>;
  }

  const { animals, milk, sales, expenses, profitLoss } = dashboardData;

  // Prepare data for charts
  const animalData = [
    { name: 'Male', value: animals.male },
    { name: 'Female', value: animals.female }
  ];

  const expenseData = Object.keys(expenses.byCategory || {}).map(category => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    amount: expenses.byCategory[category]
  }));

  const salesData = Object.keys(sales.salesByType || {}).map(type => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    revenue: sales.salesByType[type].revenue
  }));

  // Prepare sales by customer data including received amounts
  const customerSalesData = Object.keys(sales.salesByCustomer || {}).map(customer => ({
    name: customer,
    revenue: sales.salesByCustomer[customer].revenue,
    received: sales.salesByCustomer[customer].received || 0,
    pending: sales.salesByCustomer[customer].pending || 0,
    quantity: sales.salesByCustomer[customer].quantity
  }));

  const weeklyData = milk.weeklyTrend?.map(item => ({
    date: item._id,
    yield: item.totalYield
  })) || [];

  return (
    <div className="container mt-3">
      <div className="flex-between mb-3">
        <h1 className="page-title">Dashboard</h1>
        
        {/* Month/Year Filter */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <FaCalendarAlt color="#6b7280" />
          <select 
            className="form-select" 
            value={filterMonth} 
            onChange={(e) => setFilterMonth(parseInt(e.target.value))}
            style={{ minWidth: '120px' }}
          >
            {months.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
          <select 
            className="form-select" 
            value={filterYear} 
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
            style={{ minWidth: '90px' }}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-4">
        <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dbeafe' }}>
            <GiCow color="#2563eb" />
          </div>
          <div className="stat-content">
            <h3>{animals.total}</h3>
            <p>Total Animals</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5' }}>
            <FaTint color="#10b981" />
          </div>
          <div className="stat-content">
            <h3>{Number(milk.todayYield || 0).toFixed(2)} L</h3>
            <p>Today's Milk Yield</p>
            <span className={`stat-trend ${Number(milk.yieldTrend || 0) >= 0 ? 'positive' : 'negative'}`}>
              {Number(milk.yieldTrend || 0) >= 0 ? '↑' : '↓'} {Number(Math.abs(milk.yieldTrend || 0)).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <FaMoneyBillWave color="#f59e0b" />
          </div>
          <div className="stat-content">
            <h3>Rs {Number(sales.monthRevenue || 0).toFixed(2)}</h3>
            <p>Month Revenue</p>
            <span className={`stat-trend ${Number(sales.revenueTrend || 0) >= 0 ? 'positive' : 'negative'}`}>
              {Number(sales.revenueTrend || 0) >= 0 ? '↑' : '↓'} {Number(Math.abs(sales.revenueTrend || 0)).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: profitLoss.status === 'profit' ? '#d1fae5' : '#fee2e2' }}>
            <FaChartLine color={profitLoss.status === 'profit' ? '#10b981' : '#ef4444'} />
          </div>
          <div className="stat-content">
            <h3>Rs {Number(profitLoss.monthProfit || 0).toFixed(2)}</h3>
            <p>Monthly {profitLoss.status === 'profit' ? 'Profit' : 'Loss'}</p>
            <span className="stat-badge">{profitLoss.profitMargin}% margin</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-2">
        {/* Weekly Milk Production Trend */}
        <div className="card">
          <h3 className="card-title">Weekly Milk Production</h3>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="yield" stroke="#2563eb" strokeWidth={2} name="Yield (L)" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center">No data available</p>
          )}
        </div>

        {/* Animal Distribution */}
        <div className="card">
          <h3 className="card-title">Animal Distribution</h3>
          {animals.total > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={animalData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {animalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center">No animals added yet</p>
          )}
        </div>

        {/* Expenses by Category */}
        <div className="card">
          <h3 className="card-title">Monthly Expenses by Category</h3>
          {expenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#f59e0b" name="Amount (Rs )" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center">No expenses recorded</p>
          )}
        </div>

        {/* Sales by Customer Type */}
        <div className="card">
          <h3 className="card-title">Sales Distribution</h3>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue (Rs )" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center">No sales recorded</p>
          )}
        </div>
      </div>

      {/* Sales by Customer with Received Amount */}
      <div className="card mb-3">
        <h3 className="card-title">Sales per Customer ({filterInfo?.monthName || months[filterMonth]} {filterYear})</h3>
        {customerSalesData.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="text-left">Customer</th>
                  <th className="text-right">Quantity (L)</th>
                  <th className="text-right">Total Revenue</th>
                  <th className="text-right">Received</th>
                  <th className="text-right">Pending</th>
                </tr>
              </thead>
              <tbody>
                {customerSalesData.map((customer, index) => (
                  <tr key={index}>
                    <td className="text-left">{customer.name}</td>
                    <td className="text-right">{customer.quantity.toFixed(1)} L</td>
                    <td className="text-right">Rs {customer.revenue.toFixed(2)}</td>
                    <td className="text-right" style={{ color: 'var(--success-color)' }}>Rs {customer.received.toFixed(2)}</td>
                    <td className="text-right" style={{ color: customer.pending > 0 ? 'var(--danger-color)' : 'var(--text-secondary)' }}>
                      Rs {customer.pending.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center">No customer sales data available</p>
        )}
      </div>

      {/* Alerts and Recent Activity */}
      <div className="grid grid-2">
        {dashboardData.alerts?.upcomingVaccinations?.length > 0 && (
          <div className="card">
            <h3 className="card-title">Upcoming Vaccinations</h3>
            <div className="alert-list">
              {dashboardData.alerts.upcomingVaccinations
                .filter(vacc => vacc.animalId) // Filter out entries with null animalId
                .map(vacc => (
                <div key={vacc._id} className="alert-item">
                  <strong>{vacc.animalId?.tagNumber || 'Unknown'}</strong> - {vacc.vaccineName}
                  <span className="alert-date">
                    {new Date(vacc.nextDueDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {dashboardData.alerts?.recentCalves?.length > 0 && (
          <div className="card">
            <h3 className="card-title">Recent Calves</h3>
            <div className="alert-list">
              {dashboardData.alerts.recentCalves
                .filter(calf => calf.animalId) // Filter out entries with null animalId
                .map(calf => (
                <div key={calf._id} className="alert-item">
                  <strong>{calf.animalId?.tagNumber || 'Unknown'}</strong> - {calf.gender}
                  <span className="alert-date">
                    Birth Weight: {calf.birthWeight} kg
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
