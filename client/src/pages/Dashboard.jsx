import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaTint, FaMoneyBillWave, FaChartLine } from 'react-icons/fa';
import { GiCow } from 'react-icons/gi';
import api from '../utils/api';
import './Dashboard.css';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard');
      setDashboardData(response.data.dashboard);
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

  const weeklyData = milk.weeklyTrend?.map(item => ({
    date: item._id,
    yield: item.totalYield
  })) || [];

  return (
    <div className="container mt-3">
      <h1 className="page-title">Dashboard</h1>

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
            <h3>₹{Number(sales.monthRevenue || 0).toFixed(2)}</h3>
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
            <h3>₹{Number(profitLoss.monthProfit || 0).toFixed(2)}</h3>
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
                <Bar dataKey="amount" fill="#f59e0b" name="Amount (₹)" />
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
                <Bar dataKey="revenue" fill="#10b981" name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center">No sales recorded</p>
          )}
        </div>
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
