import React from 'react';
import './StatCard.css';

const StatCard = ({ title, today, week, month, color }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="stat-card" style={{ borderTopColor: color }}>
      <h3 className="stat-card-title">{title}</h3>
      <div className="stat-values">
        <div className="stat-item">
          <span className="stat-label">Today</span>
          <span className="stat-value">{formatCurrency(today)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">This Week</span>
          <span className="stat-value">{formatCurrency(week)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">This Month</span>
          <span className="stat-value">{formatCurrency(month)}</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;

