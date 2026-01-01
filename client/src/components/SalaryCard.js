import React from 'react';
import './SalaryCard.css';

const SalaryCard = ({ salaryStats }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="salary-card">
      <div className="salary-header">
        <h2 className="salary-title">💰 Salary Statistics</h2>
      </div>

      <div className="salary-stats">
        <div className="salary-stat-item">
          <span className="salary-label">Monthly Salary</span>
          <span className="salary-value primary">{formatCurrency(salaryStats?.monthlySalaryDisplay || salaryStats?.monthlySalary || 0)}</span>
        </div>
        <div className="salary-stat-item">
          <span className="salary-label">Remaining This Month</span>
          <span className="salary-value success">{formatCurrency(salaryStats?.remaining || 0)}</span>
        </div>
        <div className="salary-stat-item">
          <span className="salary-label">Used Today</span>
          <span className="salary-value">{formatCurrency(salaryStats?.usedToday || 0)}</span>
        </div>
        <div className="salary-stat-item">
          <span className="salary-label">Used This Week</span>
          <span className="salary-value">{formatCurrency(salaryStats?.usedThisWeek || 0)}</span>
        </div>
        <div className="salary-stat-item">
          <span className="salary-label">Used This Month</span>
          <span className="salary-value">{formatCurrency(salaryStats?.usedThisMonth || 0)}</span>
        </div>
      </div>
    </div>
  );
};

export default SalaryCard;

