import React from 'react';
import './RoomAnalytics.css';

const RoomAnalytics = ({ analytics }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!analytics) {
    return <div className="loading">Loading analytics...</div>;
  }

  return (
    <div className="room-analytics">
      <h3 className="analytics-title">Room Analytics</h3>
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-card-label">Today's Total</div>
          <div className="analytics-card-value">{formatCurrency(analytics.today)}</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-label">This Week's Total</div>
          <div className="analytics-card-value">{formatCurrency(analytics.week)}</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-label">This Month's Total</div>
          <div className="analytics-card-value">{formatCurrency(analytics.month)}</div>
        </div>
        <div className="analytics-card highlight">
          <div className="analytics-card-label">You Paid</div>
          <div className="analytics-card-value positive">{formatCurrency(analytics.userPaid)}</div>
        </div>
        <div className="analytics-card highlight">
          <div className="analytics-card-label">You Owe</div>
          <div className="analytics-card-value negative">{formatCurrency(analytics.userOwed)}</div>
        </div>
      </div>
    </div>
  );
};

export default RoomAnalytics;

