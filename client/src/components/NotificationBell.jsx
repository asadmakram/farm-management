import React, { useState, useEffect } from 'react';
import { FaBell, FaExclamationTriangle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './NotificationBell.css';

const NotificationBell = () => {
  const [urgentCount, setUrgentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUrgentReminders();
  }, []);

  const fetchUrgentReminders = async () => {
    try {
      const response = await api.get('/reminders');
      const vaccinations = response.data.data.vaccinations || [];

      // Count urgent reminders (overdue + due today + due within 3 days)
      const urgentVaccinations = vaccinations.filter(vacc => {
        const daysUntilDue = getDaysUntilDue(vacc.nextDueDate);
        return daysUntilDue <= 3; // Overdue (negative), today (0), or within 3 days
      });

      setUrgentCount(urgentVaccinations.length);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching urgent reminders:', error);
      setLoading(false);
    }
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) return null;

  return (
    <Link
      to="/reminders"
      className={`notification-bell ${urgentCount > 0 ? 'has-notifications' : ''}`}
      title={`${urgentCount} urgent reminder${urgentCount !== 1 ? 's' : ''}`}
    >
      <FaBell />
      {urgentCount > 0 && (
        <span className="notification-badge">
          {urgentCount > 9 ? '9+' : urgentCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;