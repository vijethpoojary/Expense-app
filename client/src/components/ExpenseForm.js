import React, { useState, useEffect } from 'react';
import './ExpenseForm.css';

const ExpenseForm = ({ expense, categories, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    itemName: '',
    amount: '',
    category: '',
    sourceType: 'salary',
    date: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (expense) {
      setFormData({
        itemName: expense.itemName || '',
        amount: expense.amount || '',
        category: expense.category || '',
        sourceType: expense.sourceType || 'salary',
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    }
  }, [expense]);

  const validate = () => {
    const newErrors = {};
    if (!formData.itemName.trim()) {
      newErrors.itemName = 'Item name is required';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Get user's timezone offset in minutes
      const timezoneOffset = -new Date().getTimezoneOffset();
      onSubmit({
        ...formData,
        amount: parseFloat(formData.amount),
        timezoneOffset: timezoneOffset
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="form-overlay">
      <div className="form-container">
        <h2 className="form-title">{expense ? 'Edit Expense' : 'Add New Expense'}</h2>
        <form onSubmit={handleSubmit} className="expense-form">
          <div className="form-group">
            <label htmlFor="itemName">Item Name *</label>
            <input
              type="text"
              id="itemName"
              name="itemName"
              value={formData.itemName}
              onChange={handleChange}
              className={errors.itemName ? 'error' : ''}
            />
            {errors.itemName && <span className="error-message">{errors.itemName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount (₹) *</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={errors.amount ? 'error' : ''}
            />
            {errors.amount && <span className="error-message">{errors.amount}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              list="categories-list"
              placeholder="e.g., Food, Transport, Entertainment"
            />
            <datalist id="categories-list">
              {categories.map((cat, idx) => (
                <option key={idx} value={cat} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label htmlFor="sourceType">Source Type *</label>
            <select
              id="sourceType"
              name="sourceType"
              value={formData.sourceType}
              onChange={handleChange}
            >
              <option value="salary">Salary</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              readOnly={!expense}
              className={!expense ? 'readonly' : ''}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit">
              {expense ? 'Update' : 'Add'} Expense
            </button>
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;

