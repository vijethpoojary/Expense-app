import React, { useState, useEffect } from 'react';
import './InvestmentForm.css';

const InvestmentForm = ({ investment, investmentTypes, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    investmentName: '',
    amount: '',
    investmentType: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (investment) {
      setFormData({
        investmentName: investment.investmentName || '',
        amount: investment.amount || '',
        investmentType: investment.investmentType || '',
        date: investment.date ? new Date(investment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    }
  }, [investment]);

  const validate = () => {
    const newErrors = {};
    if (!formData.investmentName.trim()) {
      newErrors.investmentName = 'Investment name is required';
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
      onSubmit({
        ...formData,
        amount: parseFloat(formData.amount)
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

  return (
    <div className="form-overlay">
      <div className="form-container">
        <h2 className="form-title">{investment ? 'Edit Investment' : 'Add New Investment'}</h2>
        <form onSubmit={handleSubmit} className="investment-form">
          <div className="form-group">
            <label htmlFor="investmentName">Investment Name *</label>
            <input
              type="text"
              id="investmentName"
              name="investmentName"
              value={formData.investmentName}
              onChange={handleChange}
              className={errors.investmentName ? 'error' : ''}
            />
            {errors.investmentName && <span className="error-message">{errors.investmentName}</span>}
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
            <label htmlFor="investmentType">Investment Type</label>
            <input
              type="text"
              id="investmentType"
              name="investmentType"
              value={formData.investmentType}
              onChange={handleChange}
              list="investment-types-list"
              placeholder="e.g., Stocks, Mutual Funds, Fixed Deposit"
            />
            <datalist id="investment-types-list">
              {investmentTypes.map((type, idx) => (
                <option key={idx} value={type} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              readOnly={!investment}
              className={!investment ? 'readonly' : ''}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit">
              {investment ? 'Update' : 'Add'} Investment
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

export default InvestmentForm;

