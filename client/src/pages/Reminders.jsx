import React, { useState, useEffect } from 'react';
import { FaBell, FaSyringe, FaCalendarAlt, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './PageStyles.css';

const Reminders = () => {
  const [reminders, setReminders] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, []);

  useEffect(() => {
    if (reminders?.vaccinations) {
      // Show notifications for urgent reminders
      const overdue = reminders.vaccinations.filter(v => getDaysUntilDue(v.nextDueDate) < 0);
      const dueToday = reminders.vaccinations.filter(v => getDaysUntilDue(v.nextDueDate) === 0);
      const dueSoon = reminders.vaccinations.filter(v => {
        const days = getDaysUntilDue(v.nextDueDate);
        return days > 0 && days <= 3;
      });

      // Show notifications for urgent items
      if (overdue.length > 0) {
        toast.error(`🚨 ${overdue.length} vaccination${overdue.length > 1 ? 's' : ''} overdue!`, {
          autoClose: false,
          closeOnClick: false
        });
      }

      if (dueToday.length > 0) {
        toast.warning(`⚠️ ${dueToday.length} vaccination${dueToday.length > 1 ? 's' : ''} due today!`, {
          autoClose: false,
          closeOnClick: false
        });
      }

      if (dueSoon.length > 0) {
        toast.info(`📅 ${dueSoon.length} vaccination${dueSoon.length > 1 ? 's' : ''} due within 3 days`, {
          autoClose: 10000
        });
      }
    }
  }, [reminders]);

  const fetchReminders = async () => {
    try {
      const response = await api.get('/reminders');
      setReminders(response.data.data);
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching reminders');
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

  const getReminderPriority = (dueDate) => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return { level: 'overdue', color: '#dc2626', icon: FaExclamationTriangle };
    if (days === 0) return { level: 'today', color: '#ea580c', icon: FaExclamationTriangle };
    if (days <= 3) return { level: 'urgent', color: '#d97706', icon: FaExclamationTriangle };
    if (days <= 7) return { level: 'soon', color: '#f59e0b', icon: FaCalendarAlt };
    return { level: 'upcoming', color: '#16a34a', icon: FaCheckCircle };
  };

  const formatDueDate = (dueDate) => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  if (loading) return <div className="container mt-3">Loading reminders...</div>;

  if (!reminders) return <div className="container mt-3">No reminders available</div>;

  const { vaccinations, calves } = reminders;

  return (
    <div className="container mt-3">
      <div className="page-header-mobile">
        <h1 className="page-title"><FaBell /> Reminders</h1>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon" style={{ background: '#dc2626' }}>
            <FaExclamationTriangle />
          </div>
          <div className="summary-content">
            <span className="summary-label">Overdue</span>
            <span className="summary-value">
              {vaccinations.filter(v => getDaysUntilDue(v.nextDueDate) < 0).length}
            </span>
            <span className="summary-sub">Need attention</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: '#ea580c' }}>
            <FaExclamationTriangle />
          </div>
          <div className="summary-content">
            <span className="summary-label">Due Today</span>
            <span className="summary-value">
              {vaccinations.filter(v => getDaysUntilDue(v.nextDueDate) === 0).length}
            </span>
            <span className="summary-sub">Action required</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: '#f59e0b' }}>
            <FaCalendarAlt />
          </div>
          <div className="summary-content">
            <span className="summary-label">Due Soon</span>
            <span className="summary-value">
              {vaccinations.filter(v => {
                const days = getDaysUntilDue(v.nextDueDate);
                return days > 0 && days <= 7;
              }).length}
            </span>
            <span className="summary-sub">Next 7 days</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: '#16a34a' }}>
            <FaCheckCircle />
          </div>
          <div className="summary-content">
            <span className="summary-label">Upcoming</span>
            <span className="summary-value">
              {vaccinations.filter(v => getDaysUntilDue(v.nextDueDate) > 7).length}
            </span>
            <span className="summary-sub">Future reminders</span>
          </div>
        </div>
      </div>

      {/* Vaccination Reminders */}
      <div className="reminders-section">
        <h2 className="section-title"><FaSyringe /> Vaccination Reminders</h2>

        {vaccinations.length > 0 ? (
          <div className="reminders-list">
            {vaccinations
              .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))
              .map(vacc => {
                const priority = getReminderPriority(vacc.nextDueDate);
                const PriorityIcon = priority.icon;

                return (
                  <div key={vacc._id} className={`reminder-card priority-${priority.level}`}>
                    <div className="reminder-header">
                      <div className="reminder-icon" style={{ backgroundColor: priority.color }}>
                        <PriorityIcon />
                      </div>
                      <div className="reminder-info">
                        <h3 className="reminder-title">
                          {vacc.animalId?.tagNumber || 'Unknown Animal'} - {vacc.vaccineName}
                        </h3>
                        <p className="reminder-subtitle">
                          {vacc.animalId?.name || 'No name'} • {vacc.veterinarian || 'No vet specified'}
                        </p>
                      </div>
                      <div className="reminder-date">
                        <span className="due-date" style={{ color: priority.color }}>
                          {formatDueDate(vacc.nextDueDate)}
                        </span>
                        <span className="actual-date">
                          {new Date(vacc.nextDueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="reminder-details">
                      <div className="detail-item">
                        <span className="detail-label">Last administered:</span>
                        <span className="detail-value">
                          {new Date(vacc.dateAdministered).toLocaleDateString()}
                        </span>
                      </div>
                      {vacc.notes && (
                        <div className="detail-item">
                          <span className="detail-label">Notes:</span>
                          <span className="detail-value">{vacc.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="empty-state">
            <FaSyringe size={48} />
            <p>No vaccination reminders</p>
            <p className="empty-subtitle">All vaccinations are up to date! 🎉</p>
          </div>
        )}
      </div>

      {/* Recent Calves Section */}
      {calves && calves.length > 0 && (
        <div className="reminders-section">
          <h2 className="section-title">🐮 Recent Calves</h2>
          <div className="reminders-list">
            {calves.map(calf => (
              <div key={calf._id} className="reminder-card priority-info">
                <div className="reminder-header">
                  <div className="reminder-icon" style={{ backgroundColor: '#3b82f6' }}>
                    🐮
                  </div>
                  <div className="reminder-info">
                    <h3 className="reminder-title">
                      {calf.animalId?.tagNumber || 'Unknown'} - {calf.gender} calf
                    </h3>
                    <p className="reminder-subtitle">
                      Born to {calf.motherId?.tagNumber || 'Unknown mother'}
                    </p>
                  </div>
                  <div className="reminder-date">
                    <span className="actual-date">
                      {new Date(calf.birthDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="reminder-details">
                  <div className="detail-item">
                    <span className="detail-label">Birth weight:</span>
                    <span className="detail-value">{calf.birthWeight} kg</span>
                  </div>
                  {calf.notes && (
                    <div className="detail-item">
                      <span className="detail-label">Notes:</span>
                      <span className="detail-value">{calf.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;