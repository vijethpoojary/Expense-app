import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import './MonthlySummary.css';

const MonthlySummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    fetchMonthlySummary();
  }, [selectedYear, selectedMonth]);

  const fetchMonthlySummary = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getMonthlySummary(selectedYear, selectedMonth - 1);
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (loading) {
    return <div className="loading">Loading monthly summary...</div>;
  }

  return (
    <div className="monthly-summary">
      <div className="summary-header">
        <h1 className="page-title">Monthly Summary</h1>
        <div className="month-selector">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="month-select"
          >
            {months.map((month, idx) => (
              <option key={idx} value={idx + 1}>{month}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="year-select"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {summary && (
        <>
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Expenses by Category</h3>
              {summary.expensesByCategory.length > 0 ? (
                <div className="category-list">
                  {summary.expensesByCategory.map((item, idx) => (
                    <div key={idx} className="category-item">
                      <span className="category-name">{item._id || 'Uncategorized'}</span>
                      <span className="category-amount">{formatCurrency(item.total)}</span>
                      <span className="category-count">({item.count} items)</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No expenses this month</p>
              )}
            </div>

            <div className="summary-card">
              <h3>Expenses by Source</h3>
              {summary.expensesBySource.length > 0 ? (
                <div className="source-list">
                  {summary.expensesBySource.map((item, idx) => (
                    <div key={idx} className="source-item">
                      <span className="source-name">{item._id}</span>
                      <span className="source-amount">{formatCurrency(item.total)}</span>
                      <span className="source-count">({item.count} items)</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No expenses this month</p>
              )}
            </div>

            <div className="summary-card">
              <h3>Investments by Type</h3>
              {summary.investmentsByType.length > 0 ? (
                <div className="investment-type-list">
                  {summary.investmentsByType.map((item, idx) => (
                    <div key={idx} className="investment-type-item">
                      <span className="investment-type-name">{item._id || 'Uncategorized'}</span>
                      <span className="investment-type-amount">{formatCurrency(item.total)}</span>
                      <span className="investment-type-count">({item.count} items)</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No investments this month</p>
              )}
            </div>
          </div>

          <div className="daily-breakdown">
            <h2 className="section-title">Daily Breakdown</h2>
            <div className="breakdown-cards">
              <div className="breakdown-card">
                <h3>Daily Expenses</h3>
                {summary.dailyExpenses.length > 0 ? (
                  <div className="daily-list">
                    {summary.dailyExpenses.map((item, idx) => (
                      <div key={idx} className="daily-item">
                        <span className="daily-date">{item._id}</span>
                        <span className="daily-amount">{formatCurrency(item.total)}</span>
                        <span className="daily-count">({item.count} items)</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No expenses this month</p>
                )}
              </div>

              <div className="breakdown-card">
                <h3>Daily Investments</h3>
                {summary.dailyInvestments.length > 0 ? (
                  <div className="daily-list">
                    {summary.dailyInvestments.map((item, idx) => (
                      <div key={idx} className="daily-item">
                        <span className="daily-date">{item._id}</span>
                        <span className="daily-amount">{formatCurrency(item.total)}</span>
                        <span className="daily-count">({item.count} items)</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No investments this month</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MonthlySummary;

