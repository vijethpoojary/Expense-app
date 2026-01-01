import React from 'react';
import './ExpenseList.css';

const ExpenseList = ({ expenses, onEdit, onDelete }) => {
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
      <div className="expense-list-header">
        <div className="expense-header-item">Item</div>
        <div className="expense-header-item">Amount</div>
        <div className="expense-header-item">Category</div>
        <div className="expense-header-item">Source</div>
        <div className="expense-header-item">Date</div>
        <div className="expense-header-item">Actions</div>
      </div>
      {expenses.map(expense => (
        <div key={expense._id} className="expense-item">
          <div className="expense-cell item-name">{expense.itemName}</div>
          <div className="expense-cell amount">{formatCurrency(expense.amount)}</div>
          <div className="expense-cell category">
            {expense.category || <span className="no-category">—</span>}
          </div>
          <div className="expense-cell source">
            <span className={`source-badge ${expense.sourceType}`}>
              {expense.sourceType}
            </span>
          </div>
          <div className="expense-cell date">{formatDate(expense.date)}</div>
          <div className="expense-cell actions">
            <button className="btn-edit" onClick={() => onEdit(expense)}>
              ✏️
            </button>
            <button className="btn-delete" onClick={() => onDelete(expense._id)}>
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExpenseList;

