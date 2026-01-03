import React, { useState, useEffect } from 'react';
import './ExpenseList.css';

const ExpenseList = ({ expenses, onEdit, onDelete, onSelectionChange }) => {
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setSelectedIds([]);
  }, [expenses]);

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedIds);
    }
  }, [selectedIds, onSelectionChange]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(expenses.map(expense => expense._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const isAllSelected = expenses.length > 0 && selectedIds.length === expenses.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < expenses.length;
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
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

  if (expenses.length === 0) {
    return (
      <div className="empty-state">
        <p>No expenses found. Add your first expense to get started!</p>
      </div>
    );
  }

  return (
    <div className="expense-list">
      <div className="expense-list-header desktop-only">
        <div className="expense-header-item checkbox-header">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={(input) => {
              if (input) input.indeterminate = isIndeterminate;
            }}
            onChange={handleSelectAll}
            aria-label="Select all expenses"
          />
        </div>
        <div className="expense-header-item">Item</div>
        <div className="expense-header-item">Amount</div>
        <div className="expense-header-item">Category</div>
        <div className="expense-header-item">Source</div>
        <div className="expense-header-item">Date</div>
        <div className="expense-header-item">Actions</div>
      </div>
      {expenses.map(expense => (
        <div key={expense._id} className="expense-item">
          <div className="expense-cell checkbox-cell">
            <input
              type="checkbox"
              checked={selectedIds.includes(expense._id)}
              onChange={() => handleSelectOne(expense._id)}
              aria-label={`Select ${expense.itemName}`}
            />
          </div>
          <span className="expense-cell item-name">
            {expense.itemName}
          </span>
          <span className="expense-cell amount">
            {formatCurrency(expense.amount)}
          </span>
          <button 
            className="btn-edit expense-cell" 
            onClick={() => onEdit(expense)}
            aria-label={`Edit ${expense.itemName}`}
          >
            ✏️
          </button>
          <button 
            className="btn-delete expense-cell" 
            onClick={() => onDelete(expense._id)}
            aria-label={`Delete ${expense.itemName}`}
          >
            🗑️
          </button>
          <span className="expense-cell source">
            <span className={`source-badge ${expense.sourceType}`}>
              {expense.sourceType}
            </span>
          </span>
          <div className="expense-cell category desktop-only" data-label="Category:">
            {expense.category || <span className="no-category">—</span>}
          </div>
          <div className="expense-cell date desktop-only" data-label="Date:">
            {formatDate(expense.date)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExpenseList;

