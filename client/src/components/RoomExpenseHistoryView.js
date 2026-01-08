import React, { useState, useEffect, useMemo } from 'react';
import { roomExpenseAPI } from '../services/api';
import './RoomExpenseHistoryView.css';

const RoomExpenseHistoryView = ({ room, currentUserId, onClose }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    memberName: ''
  });

  useEffect(() => {
    fetchHistory();
  }, [room?._id, filters]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await roomExpenseAPI.getHistory(room._id, filters);
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expense history:', error);
      alert('Failed to load expense history');
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set();
    expenses.forEach(exp => {
      if (exp.category) cats.add(exp.category);
    });
    return Array.from(cats).sort();
  }, [expenses]);

  // Sort expenses by date: today first, then yesterday, then older
  const sortedExpenses = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return [...expenses].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      dateA.setHours(0, 0, 0, 0);
      dateB.setHours(0, 0, 0, 0);

      // Today's expenses first
      if (dateA.getTime() === today.getTime() && dateB.getTime() !== today.getTime()) return -1;
      if (dateB.getTime() === today.getTime() && dateA.getTime() !== today.getTime()) return 1;

      // Yesterday's expenses second
      if (dateA.getTime() === yesterday.getTime() && dateB.getTime() !== yesterday.getTime()) return -1;
      if (dateB.getTime() === yesterday.getTime() && dateA.getTime() !== yesterday.getTime()) return 1;

      // Then sort by date descending (newest first)
      return dateB.getTime() - dateA.getTime();
    });
  }, [expenses]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getMemberInfo = (userId) => {
    return room.members?.find(
      member => member.userId?.toString() === userId?.toString()
    );
  };

  const areAllPaid = (expense) => {
    if (!expense.splitDetails || expense.splitDetails.length === 0) return false;
    return expense.splitDetails.every(split => split.status === 'paid');
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      category: '',
      memberName: ''
    });
  };

  if (loading) {
    return (
      <div className="history-overlay" onClick={onClose}>
        <div className="history-modal" onClick={(e) => e.stopPropagation()}>
          <div className="loading">Loading history...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="history-overlay" onClick={onClose}>
        <div className="history-modal" onClick={(e) => e.stopPropagation()}>
          <div className="history-header">
            <h2>Expense History</h2>
            <button className="btn-close-history" onClick={onClose}>✕</button>
          </div>

          <div className="history-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="history-startDate">Start Date</label>
                <input
                  type="date"
                  id="history-startDate"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label htmlFor="history-endDate">End Date</label>
                <input
                  type="date"
                  id="history-endDate"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label htmlFor="history-category">Category</label>
                <select
                  id="history-category"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="history-memberName">Member Name</label>
                <input
                  type="text"
                  id="history-memberName"
                  value={filters.memberName}
                  onChange={(e) => handleFilterChange('memberName', e.target.value)}
                  placeholder="Search by member name"
                />
              </div>
              <button className="btn-clear-filters" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          </div>

          <div className="history-content">
            {sortedExpenses.length === 0 ? (
              <div className="empty-state">
                <p>No expenses found in history.</p>
              </div>
            ) : (
              <div className="history-cards">
                {sortedExpenses.map(expense => {
                  const payerInfo = getMemberInfo(expense.paidBy?._id || expense.paidBy);
                  const allPaid = areAllPaid(expense);
                  
                  return (
                    <div
                      key={expense._id}
                      className={`history-card ${expense.isArchived ? 'archived' : ''}`}
                      onClick={() => setSelectedExpense(expense)}
                    >
                      <div className="history-card-header">
                        <div className="history-card-member">
                          <span className="member-name">{payerInfo?.name || 'Unknown'}</span>
                          {expense.isArchived && (
                            <span className="archived-badge">✓ All Paid</span>
                          )}
                        </div>
                        <div className="history-card-amount">
                          {formatCurrency(expense.totalAmount)}
                        </div>
                      </div>
                      <div className="history-card-date">
                        {formatDate(expense.date)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedExpense && (
        <ExpenseDetailModal
          expense={selectedExpense}
          room={room}
          currentUserId={currentUserId}
          onClose={() => setSelectedExpense(null)}
        />
      )}
    </>
  );
};

const ExpenseDetailModal = ({ expense, room, currentUserId, onClose }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMemberInfo = (userId) => {
    return room.members?.find(
      member => member.userId?.toString() === userId?.toString()
    );
  };

  const payerInfo = getMemberInfo(expense.paidBy?._id || expense.paidBy);
  const allPaid = expense.splitDetails?.every(split => split.status === 'paid') || false;

  return (
    <div className="expense-detail-overlay" onClick={onClose}>
      <div className="expense-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="expense-detail-header">
          <h3>Expense Details</h3>
          <button className="btn-close-detail" onClick={onClose}>✕</button>
        </div>

        <div className="expense-detail-content">
          <div className="detail-section">
            <div className="detail-item">
              <span className="detail-label">Description:</span>
              <span className="detail-value">{expense.description}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Amount:</span>
              <span className="detail-value">{formatCurrency(expense.totalAmount)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Date:</span>
              <span className="detail-value">{formatDate(expense.date)}</span>
            </div>
            {expense.category && (
              <div className="detail-item">
                <span className="detail-label">Category:</span>
                <span className="detail-value">{expense.category}</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Paid By:</span>
              <span className="detail-value">{payerInfo?.name || 'Unknown'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className={`detail-value ${allPaid ? 'all-paid' : 'pending'}`}>
                {allPaid ? '✓ All Paid' : '⚠ Some Pending'}
              </span>
            </div>
          </div>

          <div className="detail-section">
            <h4>Payment Status:</h4>
            <div className="payment-status-list">
              {expense.splitDetails?.map((split, index) => {
                const member = getMemberInfo(split.userId);
                const isPayer = split.userId?.toString() === (expense.paidBy?._id?.toString() || expense.paidBy?.toString());
                const remainingAmount = split.shareAmount - (split.paidAmount || 0);

                return (
                  <div key={index} className="payment-status-item">
                    <div className="payment-member-info">
                      <span className="payment-member-name">
                        {member?.name || 'Unknown'}
                        {isPayer && <span className="payer-badge">Paid</span>}
                      </span>
                    </div>
                    <div className="payment-amount-info">
                      {isPayer ? (
                        <span className="payment-status paid">₹0 (Paid)</span>
                      ) : (
                        <span className={`payment-status ${split.status === 'paid' ? 'paid' : 'pending'}`}>
                          {split.status === 'paid' 
                            ? '₹0 (Paid)' 
                            : `₹${remainingAmount.toFixed(2)} (Pending)`
                          }
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomExpenseHistoryView;

