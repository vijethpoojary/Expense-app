import React from 'react';
import './FAB.css';

/**
 * Floating Action Button component
 * Used for primary actions on mobile (e.g., Add Expense, Add Investment)
 */
const FAB = ({ onClick, icon = '+', label, 'aria-label': ariaLabel }) => {
  return (
    <button
      className="fab"
      onClick={onClick}
      aria-label={ariaLabel || label || 'Add'}
      type="button"
    >
      <span className="fab-icon" aria-hidden="true">
        {icon}
      </span>
      {label && <span className="fab-label">{label}</span>}
    </button>
  );
};

export default FAB;

