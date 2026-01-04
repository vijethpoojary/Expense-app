import React, { useState, useMemo } from 'react';
import { roomExpenseAPI } from '../services/api';
import './RoomExpenseHistory.css';

const RoomExpenseHistory = ({ expenses, room, currentUserId, onUpdateStatus }) => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    paymentStatus: ''
  });
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [editingPartialPayment, setEditingPartialPayment] = useState({});
  const [partialPaymentAmounts, setPartialPaymentAmounts] = useState({});

  const categories = useMemo(() => {
    const cats = new Set();
    expenses.forEach(exp => {
      if (exp.category) cats.add(exp.category);
    });
    return Array.from(cats).sort();
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];

    if (filters.startDate) {
      filtered = filtered.filter(exp => {
        const expDate = new Date(exp.date).toISOString().split('T')[0];
        return expDate >= filters.startDate;
      });
    }

    if (filters.endDate) {
      filtered = filtered.filter(exp => {
        const expDate = new Date(exp.date).toISOString().split('T')[0];
        return expDate <= filters.endDate;
      });
    }

    if (filters.category) {
      filtered = filtered.filter(exp => exp.category === filters.category);
    }

    if (filters.paymentStatus) {
      filtered = filtered.filter(exp => {
        const userSplit = exp.splitDetails?.find(
          split => split.userId?.toString() === currentUserId?.toString()
        );
        return userSplit?.status === filters.paymentStatus;
      });
    }

    return filtered;
  }, [expenses, filters, currentUserId]);

  const handleUpdateStatus = async (expenseId, memberUserId, newStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [`${expenseId}-${memberUserId}`]: true }));
      await roomExpenseAPI.updatePaymentStatus(expenseId, memberUserId, newStatus);
      if (onUpdateStatus) {
        onUpdateStatus();
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert(error.response?.data?.message || 'Failed to update payment status');
    } finally {
      setUpdatingStatus(prev => {
        const newState = { ...prev };
        delete newState[`${expenseId}-${memberUserId}`];
        return newState;
      });
    }
  };

  const handlePartialPaymentChange = (expenseId, memberUserId, amount) => {
    setPartialPaymentAmounts(prev => ({
      ...prev,
      [`${expenseId}-${memberUserId}`]: amount
    }));
  };

  const handleSavePartialPayment = async (expenseId, memberUserId) => {
    const key = `${expenseId}-${memberUserId}`;
    const amount = partialPaymentAmounts[key];
    
    if (amount === undefined || amount === '') {
      alert('Please enter an amount');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      alert('Please enter a valid positive number');
      return;
    }

    try {
      setUpdatingStatus(prev => ({ ...prev, [key]: true }));
      await roomExpenseAPI.updatePartialPayment(expenseId, memberUserId, numAmount);
      setEditingPartialPayment(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
      setPartialPaymentAmounts(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
      if (onUpdateStatus) {
        onUpdateStatus();
      }
    } catch (error) {
      console.error('Error updating partial payment:', error);
      alert(error.response?.data?.message || 'Failed to update payment amount');
    } finally {
      setUpdatingStatus(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }
  };

  const handleCancelPartialPayment = (expenseId, memberUserId) => {
    const key = `${expenseId}-${memberUserId}`;
    setEditingPartialPayment(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
    setPartialPaymentAmounts(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      return;
    }

    try {
      await roomExpenseAPI.delete(expenseId);
      if (onUpdateStatus) {
        onUpdateStatus();
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert(error.response?.data?.message || 'Failed to delete expense');
    }
  };

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
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpenseCreator = (expense) => {
    return expense.paidBy?._id?.toString() === currentUserId?.toString() ||
           expense.paidBy?.toString() === currentUserId?.toString();
  };

  const getUserSplit = (expense) => {
    return expense.splitDetails?.find(
      split => split.userId?.toString() === currentUserId?.toString()
    );
  };

  const getMemberInfo = (userId) => {
    return room.members?.find(
      member => member.userId?.toString() === userId?.toString()
    );
  };

  // Calculate net balance for each member across all expenses
  // If what_they_owe >= what_they_are_owed: show (what_they_owe - what_they_are_owed)
  // If what_they_owe < what_they_are_owed: show what_they_owe
  const calculateNetBalance = useMemo(() => {
    const amountOwed = {}; // What each person owes to others
    const amountOwedToThem = {}; // What others owe to each person
    
    // Initialize balances for all members
    room.members?.forEach(member => {
      const userId = member.userId?.toString();
      amountOwed[userId] = 0;
      amountOwedToThem[userId] = 0;
    });

    // Calculate balances for each member
    expenses.forEach(expense => {
      const paidByUserId = expense.paidBy?._id?.toString() || expense.paidBy?.toString();
      
      expense.splitDetails?.forEach(split => {
        const splitUserId = split.userId?.toString() || split.userId;
        const paidAmount = split.paidAmount || 0;
        const remainingAmount = split.shareAmount - paidAmount;
        
        if (splitUserId === paidByUserId) {
          // This is the payer - they don't owe anything for this expense
          // But others owe them money
        } else {
          // This person owes money to the payer
          amountOwed[splitUserId] = (amountOwed[splitUserId] || 0) + remainingAmount;
          // The payer is owed this amount
          amountOwedToThem[paidByUserId] = (amountOwedToThem[paidByUserId] || 0) + remainingAmount;
        }
      });
    });
    
    // Calculate final display balance
    const displayBalances = {};
    room.members?.forEach(member => {
      const userId = member.userId?.toString();
      const owed = amountOwed[userId] || 0;
      const owedToThem = amountOwedToThem[userId] || 0;
      
      // If what they owe >= what they're owed: show net
      // If what they owe < what they're owed: show what they owe
      if (owed >= owedToThem) {
        displayBalances[userId] = owed - owedToThem;
      } else {
        displayBalances[userId] = owed;
      }
    });
    
    return displayBalances;
  }, [expenses, room.members]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      category: '',
      paymentStatus: ''
    });
  };

  return (
    <div className="room-expense-history">

      <div className="expense-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
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
            <label htmlFor="paymentStatus">Payment Status</label>
            <select
              id="paymentStatus"
              value={filters.paymentStatus}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <button className="btn-clear-filters" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="empty-state">
          <p>No expenses found.</p>
        </div>
      ) : (
        <div className="expenses-list">
          {filteredExpenses.map(expense => {
            const userSplit = getUserSplit(expense);
            const creator = isExpenseCreator(expense);
            return (
              <div key={expense._id} className="expense-card">
                <div className="expense-header">
                  <div className="expense-main-info">
                    <h3 className="expense-description">{expense.description}</h3>
                    <div className="expense-meta">
                      <span className="expense-date">{formatDate(expense.date)}</span>
                      {expense.category && (
                        <span className="expense-category">{expense.category}</span>
                      )}
                    </div>
                  </div>
                  <div className="expense-amount-info">
                    <div className="expense-total">Total: {formatCurrency(expense.totalAmount)}</div>
                    <div className="expense-paid-by">
                      Paid by: {expense.paidBy?.email || 'Unknown'}
                    </div>
                    {creator && (
                      <button
                        className="btn-delete-expense"
                        onClick={() => handleDeleteExpense(expense._id)}
                        title="Delete expense"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>

                <div className="expense-split-section">
                  <h4 className="split-section-title">Split Details:</h4>
                  <div className="split-details-list">
                    {expense.splitDetails?.map((split, index) => {
                      const member = getMemberInfo(split.userId);
                      const isPayer = split.userId?.toString() === expense.paidBy?._id?.toString() ||
                                     split.userId?.toString() === expense.paidBy?.toString();
                      const isCurrentUser = split.userId?.toString() === currentUserId?.toString();
                      const isUpdating = updatingStatus[`${expense._id}-${split.userId}`];

                      return (
                        <div key={index} className="split-detail-item">
                          <div className="split-member-info">
                            <span className="split-member-name">
                              {member?.name || 'Unknown'}
                              {isCurrentUser && <span className="split-badge you">You</span>}
                              {isPayer && <span className="split-badge payer">Paid</span>}
                            </span>
                          </div>
                          <div className="split-amount-info">
                            {(() => {
                              const key = `${expense._id}-${split.userId?.toString() || split.userId}`;
                              const isEditing = editingPartialPayment[key];
                              const paidAmount = split.paidAmount || 0;
                              const remainingAmount = split.shareAmount - paidAmount;
                              const isUpdating = updatingStatus[key];
                              const splitUserId = split.userId?.toString() || split.userId;
                              const netBalance = calculateNetBalance[splitUserId] || 0;

                              if (isEditing) {
                                return (
                                  <div className="partial-payment-input-group">
                                    <input
                                      type="number"
                                      className="partial-payment-input"
                                      placeholder="Enter amount"
                                      value={partialPaymentAmounts[key] !== undefined ? partialPaymentAmounts[key] : paidAmount}
                                      onChange={(e) => handlePartialPaymentChange(expense._id, split.userId?.toString() || split.userId, e.target.value)}
                                      min="0"
                                      max={split.shareAmount}
                                      step="0.01"
                                      autoFocus
                                    />
                                    <button
                                      className="btn-save-partial"
                                      onClick={() => handleSavePartialPayment(expense._id, split.userId?.toString() || split.userId)}
                                      disabled={isUpdating}
                                    >
                                      {isUpdating ? '...' : 'Save'}
                                    </button>
                                    <button
                                      className="btn-cancel-partial"
                                      onClick={() => handleCancelPartialPayment(expense._id, split.userId?.toString() || split.userId)}
                                      disabled={isUpdating}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                );
                              }

                              // Display net balance
                              // netBalance is already max(0, what_they_owe - what_they_are_owed)
                              return (
                                <>
                                  <span className={`split-status ${netBalance > 0 ? 'pending' : 'paid'}`}>
                                    {netBalance > 0 
                                      ? `Pending - ${formatCurrency(netBalance)}`
                                      : `Paid - ${formatCurrency(0)}`
                                    }
                                  </span>
                                  {creator && !isPayer && (
                                    <div className="payment-action-buttons">
                                      <button
                                        className="btn-partial-payment"
                                        onClick={() => {
                                          setEditingPartialPayment(prev => ({
                                            ...prev,
                                            [key]: true
                                          }));
                                          setPartialPaymentAmounts(prev => ({
                                            ...prev,
                                            [key]: paidAmount
                                          }));
                                        }}
                                        disabled={isUpdating}
                                      >
                                        Add Payment
                                      </button>
                                      <button
                                        className={`btn-status-toggle ${split.status}`}
                                        onClick={() => handleUpdateStatus(
                                          expense._id,
                                          split.userId?.toString() || split.userId,
                                          split.status === 'paid' ? 'pending' : 'paid'
                                        )}
                                        disabled={isUpdating}
                                      >
                                        {isUpdating ? '...' : split.status === 'paid' ? 'Mark Pending' : 'Mark Paid'}
                                      </button>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoomExpenseHistory;

