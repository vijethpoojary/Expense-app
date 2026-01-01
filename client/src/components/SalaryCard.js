import React, { useState, useEffect } from 'react';
import { salaryAPI } from '../services/api';
import './SalaryCard.css';

const SalaryCard = ({ salaryStats, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [monthlySalary, setMonthlySalary] = useState(salaryStats?.monthlySalary || 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (salaryStats?.monthlySalary !== undefined) {
      setMonthlySalary(salaryStats.monthlySalary);
    }
  }, [salaryStats]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await salaryAPI.update({ monthlySalary: parseFloat(monthlySalary) });
      setIsEditing(false);
      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error('Error updating salary:', error);
      alert('Failed to update salary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="salary-card">
      <div className="salary-header">
        <h2 className="salary-title">💰 Monthly Salary</h2>
        {!isEditing && (
          <button className="edit-btn" onClick={() => setIsEditing(true)}>
            ✏️ Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="salary-edit">
          <label>
            Monthly Salary (₹)
            <input
              type="number"
              value={monthlySalary}
              onChange={(e) => setMonthlySalary(e.target.value)}
              min="0"
              step="1000"
            />
          </label>
          <div className="edit-actions">
            <button className="save-btn" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button className="cancel-btn" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="salary-stats">
          <div className="salary-stat-item">
            <span className="salary-label">Monthly Salary</span>
            <span className="salary-value primary">{formatCurrency(salaryStats?.monthlySalary || 0)}</span>
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
      )}
    </div>
  );
};

export default SalaryCard;

