import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { FaTint, FaMoneyBillWave, FaChartLine, FaCalendarAlt, FaUsers, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { GiCow } from 'react-icons/gi';
import api from '../utils/api';
import './Dashboard.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
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
    name: type === 'door_to_door' ? 'D2D' : type.charAt(0).toUpperCase() + type.slice(1),
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
    <div className="dashboard-container">
      {/* Header with Filter */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">📊 Dashboard</h1>
          <p className="dashboard-subtitle">Overview for {months[filterMonth]} {filterYear}</p>
        </div>
        
        <div className="filter-bar">
          <FaCalendarAlt className="filter-icon-inline" />
          <select 
            className="filter-select-inline" 
            value={filterMonth} 
            onChange={(e) => setFilterMonth(parseInt(e.target.value))}
          >
            {months.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
          <select 
            className="filter-select-inline" 
            value={filterYear} 
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-card-icon">
            <GiCow />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Total Animals</span>
            <span className="stat-value">{animals.total}</span>
            <div className="stat-breakdown">
              <span>🐂 {animals.male} Male</span>
              <span>🐄 {animals.female} Female</span>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-card-icon">
            <FaTint />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Today's Milk</span>
            <span className="stat-value">{Number(milk.todayYield || 0).toFixed(1)} L</span>
            <div className="stat-trend-badge">
              {Number(milk.yieldTrend || 0) >= 0 ? (
                <span className="trend-up"><FaArrowUp /> {Number(milk.yieldTrend || 0).toFixed(1)}%</span>
              ) : (
                <span className="trend-down"><FaArrowDown /> {Number(Math.abs(milk.yieldTrend || 0)).toFixed(1)}%</span>
              )}
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-warning">
          <div className="stat-card-icon">
            <FaMoneyBillWave />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Month Revenue</span>
            <span className="stat-value">Rs {Number(sales.monthRevenue || 0).toFixed(0)}</span>
            <div className="stat-trend-badge">
              {Number(sales.revenueTrend || 0) >= 0 ? (
                <span className="trend-up"><FaArrowUp /> {Number(sales.revenueTrend || 0).toFixed(1)}%</span>
              ) : (
                <span className="trend-down"><FaArrowDown /> {Number(Math.abs(sales.revenueTrend || 0)).toFixed(1)}%</span>
              )}
            </div>
          </div>
        </div>

        <div className={`stat-card ${profitLoss.status === 'profit' ? 'stat-card-profit' : 'stat-card-loss'}`}>
          <div className="stat-card-icon">
            <FaChartLine />
          </div>
          <div className="stat-card-content">
            <span className="stat-label">Monthly {profitLoss.status === 'profit' ? 'Profit' : 'Loss'}</span>
            <span className="stat-value">Rs {Number(Math.abs(profitLoss.monthProfit) || 0).toFixed(0)}</span>
            <span className="stat-margin">{profitLoss.profitMargin}% margin</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Weekly Milk Production Trend */}
        <div className="chart-card">
          <h3 className="chart-title">📈 Milk Production Trend</h3>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="yield" stroke="#3b82f6" strokeWidth={3} fill="url(#colorYield)" name="Yield (L)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No data available</div>
          )}
        </div>

        {/* Sales Distribution */}
        <div className="chart-card">
          <h3 className="chart-title">💰 Sales by Type</h3>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#9ca3af" width={60} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`Rs ${value.toFixed(0)}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No sales recorded</div>
          )}
        </div>
      </div>

      {/* Customer Sales Section */}
      <div className="customer-sales-section">
        <div className="section-header">
          <h3 className="section-title">
            <FaUsers className="section-icon" />
            Sales per Customer
          </h3>
          <span className="section-period">{filterInfo?.monthName || months[filterMonth]} {filterYear}</span>
        </div>
        
        {customerSalesData.length > 0 ? (
          <div className="customer-cards-grid">
            {customerSalesData.map((customer, index) => (
              <div key={index} className="customer-card">
                <div className="customer-header">
                  <span className="customer-avatar">{customer.name.charAt(0).toUpperCase()}</span>
                  <span className="customer-name">{customer.name}</span>
                </div>
                <div className="customer-stats">
                  <div className="customer-stat">
                    <span className="stat-icon">🥛</span>
                    <span className="stat-value">{customer.quantity.toFixed(0)}L</span>
                  </div>
                  <div className="customer-stat">
                    <span className="stat-icon">💰</span>
                    <span className="stat-value">Rs {customer.revenue.toFixed(0)}</span>
                  </div>
                </div>
                <div className="customer-payment">
                  <div className="payment-bar">
                    <div 
                      className="payment-progress" 
                      style={{ width: `${customer.revenue > 0 ? (customer.received / customer.revenue) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="payment-info">
                    <span className="received">✅ Rs {customer.received.toFixed(0)}</span>
                    {customer.pending > 0 && (
                      <span className="pending">⏳ Rs {customer.pending.toFixed(0)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-customers">No customer sales data available</div>
        )}
      </div>

      {/* Bottom Section - More Charts and Alerts */}
      <div className="bottom-grid">
        {/* Expenses by Category */}
        <div className="chart-card">
          <h3 className="chart-title">📊 Expenses Breakdown</h3>
          {expenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="amount"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`Rs ${value.toFixed(0)}`, 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No expenses recorded</div>
          )}
        </div>

        {/* Alerts */}
        <div className="alerts-card">
          <h3 className="chart-title">🔔 Alerts & Activity</h3>
          <div className="alerts-list">
            {dashboardData.alerts?.upcomingVaccinations?.filter(v => v.animalId).slice(0, 3).map(vacc => (
              <div key={vacc._id} className="alert-item vaccination">
                <span className="alert-emoji">💉</span>
                <div className="alert-content">
                  <span className="alert-title">{vacc.animalId?.tagNumber}</span>
                  <span className="alert-desc">{vacc.vaccineName}</span>
                </div>
                <span className="alert-date">{new Date(vacc.nextDueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
              </div>
            ))}
            {dashboardData.alerts?.recentCalves?.filter(c => c.animalId).slice(0, 3).map(calf => (
              <div key={calf._id} className="alert-item calf">
                <span className="alert-emoji">🐮</span>
                <div className="alert-content">
                  <span className="alert-title">{calf.animalId?.tagNumber}</span>
                  <span className="alert-desc">{calf.gender} - {calf.birthWeight}kg</span>
                </div>
                <span className="alert-badge">New</span>
              </div>
            ))}
            {(!dashboardData.alerts?.upcomingVaccinations?.length && !dashboardData.alerts?.recentCalves?.length) && (
              <div className="no-alerts">No pending alerts 🎉</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
