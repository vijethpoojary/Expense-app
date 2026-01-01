import React, { useState, useEffect } from 'react';
import { expenseAPI } from '../services/api';
import './ExpensesHistory.css';

const ExpensesHistory = () => {
  const [history, setHistory] = useState({ weekly: [], monthly: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('weekly');
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await expenseAPI.getHistory();
      setHistory(response.data);
      // Initialize expanded state - first item expanded by default
      if (response.data.weekly.length > 0) {
        setExpandedGroups({ [response.data.weekly[0].weekKey]: true });
      }
      if (response.data.monthly.length > 0 && activeTab === 'monthly') {
        setExpandedGroups({ [response.data.monthly[0].monthKey]: true });
      }
    } catch (error) {
      console.error('Error fetching expenses history:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }
    try {
      await expenseAPI.delete(expenseId);
      await fetchHistory();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading expenses history...</div>;
  }

  return (
    <div className="expenses-history">
      <h1 className="history-title">Expenses History</h1>

      <div className="history-tabs">
        <button
          className={`tab-button ${activeTab === 'weekly' ? 'active' : ''}`}
          onClick={() => setActiveTab('weekly')}
        >
          Weekly
        </button>
        <button
          className={`tab-button ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthly')}
        >
          Monthly
        </button>
      </div>

      <div className="history-content">
        {activeTab === 'weekly' && (
          <div className="history-list">
            {history.weekly.length === 0 ? (
              <p className="empty-message">No weekly expenses found</p>
            ) : (
              history.weekly.map((week) => (
                <div key={week.weekKey} className="history-group">
                  <div
                    className="group-header"
                    onClick={() => toggleGroup(week.weekKey)}
                  >
                    <div className="group-info">
                      <h3>{week.dateRange}</h3>
                      <span className="group-total">{formatCurrency(week.total)}</span>
                    </div>
                    <span className="expand-icon">
                      {expandedGroups[week.weekKey] ? '▼' : '▶'}
                    </span>
                  </div>
                  {expandedGroups[week.weekKey] && (
                    <div className="group-expenses">
                      {week.expenses.map((expense) => (
                        <div key={expense._id} className="expense-item">
                          <div className="expense-details">
                            <span className="expense-name">{expense.itemName}</span>
                            <span className="expense-date">{formatDate(expense.date)}</span>
                            <span className="expense-category">{expense.category || 'Uncategorized'}</span>
                          </div>
                          <div className="expense-amount">
                            {formatCurrency(expense.amount)}
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteExpense(expense._id)}
                              title="Delete expense"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'monthly' && (
          <div className="history-list">
            {history.monthly.length === 0 ? (
              <p className="empty-message">No monthly expenses found</p>
            ) : (
              history.monthly.map((month) => {
                return (
                  <div key={month.monthKey} className="history-group">
                    <div
                      className="group-header"
                      onClick={() => toggleGroup(month.monthKey)}
                    >
                      <div className="group-info">
                        <h3>{month.monthLabel || new Date(month.monthStart).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h3>
                        <span className="group-total">{formatCurrency(month.total)}</span>
                      </div>
                      <span className="expand-icon">
                        {expandedGroups[month.monthKey] ? '▼' : '▶'}
                      </span>
                    </div>
                    {expandedGroups[month.monthKey] && (
                      <div className="group-expenses">
                        {month.expenses.map((expense) => (
                          <div key={expense._id} className="expense-item">
                            <div className="expense-details">
                              <span className="expense-name">{expense.itemName}</span>
                              <span className="expense-date">{formatDate(expense.date)}</span>
                              <span className="expense-category">{expense.category || 'Uncategorized'}</span>
                            </div>
                            <div className="expense-amount">
                              {formatCurrency(expense.amount)}
                              <button
                                className="delete-btn"
                                onClick={() => handleDeleteExpense(expense._id)}
                                title="Delete expense"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpensesHistory;

