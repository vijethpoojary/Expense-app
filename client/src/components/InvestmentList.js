import React from 'react';
import './InvestmentList.css';

const InvestmentList = ({ investments, onEdit, onDelete }) => {
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

  if (investments.length === 0) {
    return (
      <div className="empty-state">
        <p>No investments found. Add your first investment to get started!</p>
      </div>
    );
  }

  return (
    <div className="investment-list">
      <div className="investment-list-header">
        <div className="investment-header-item">Investment Name</div>
        <div className="investment-header-item">Amount</div>
        <div className="investment-header-item">Type</div>
        <div className="investment-header-item">Date</div>
        <div className="investment-header-item">Actions</div>
      </div>
      {investments.map(investment => (
        <div key={investment._id} className="investment-item">
          <div className="investment-cell name">{investment.investmentName}</div>
          <div className="investment-cell amount">{formatCurrency(investment.amount)}</div>
          <div className="investment-cell type">
            {investment.investmentType || <span className="no-type">—</span>}
          </div>
          <div className="investment-cell date">{formatDate(investment.date)}</div>
          <div className="investment-cell actions">
            <button className="btn-edit" onClick={() => onEdit(investment)}>
              ✏️
            </button>
            <button className="btn-delete" onClick={() => onDelete(investment._id)}>
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InvestmentList;

