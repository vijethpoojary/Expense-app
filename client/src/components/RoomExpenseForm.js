import React, { useState, useEffect } from 'react';
import './ExpenseForm.css';

const RoomExpenseForm = ({ room, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    description: '',
    totalAmount: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState({});
  const [splitDetails, setSplitDetails] = useState([]);

  useEffect(() => {
    if (formData.totalAmount && room?.members?.length > 0) {
      const amount = parseFloat(formData.totalAmount);
      if (!isNaN(amount) && amount > 0) {
        const shareAmount = amount / room.members.length;
        const details = room.members.map(member => ({
          userId: member.userId,
          email: member.email,
          name: member.name,
          shareAmount: shareAmount.toFixed(2)
        }));
        setSplitDetails(details);
      } else {
        setSplitDetails([]);
      }
    } else {
      setSplitDetails([]);
    }
  }, [formData.totalAmount, room]);

  const validate = () => {
    const newErrors = {};
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      newErrors.totalAmount = 'Amount must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        roomId: room._id,
        description: formData.description.trim(),
        totalAmount: parseFloat(formData.totalAmount),
        category: formData.category.trim(),
        date: formData.date
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="form-overlay">
      <div className="form-container">
        <h2 className="form-title">Add Room Expense</h2>
        <form onSubmit={handleSubmit} className="expense-form">
          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g., Groceries, Rent, Electricity Bill"
              className={errors.description ? 'error' : ''}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="totalAmount">Amount (₹) *</label>
            <input
              type="number"
              id="totalAmount"
              name="totalAmount"
              value={formData.totalAmount}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={errors.totalAmount ? 'error' : ''}
            />
            {errors.totalAmount && <span className="error-message">{errors.totalAmount}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="readonly"
              readOnly
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category (Optional)</label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g., Food, Utilities, Rent"
            />
          </div>

          {splitDetails.length > 0 && (
            <div className="split-breakdown">
              <label className="split-label">Split Breakdown (Equal Split):</label>
              <div className="split-list">
                {splitDetails.map((detail, index) => (
                  <div key={index} className="split-item">
                    <span className="split-member">{detail.name}</span>
                    <span className="split-amount">{formatCurrency(detail.shareAmount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-submit">Add Expense</button>
            <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomExpenseForm;

