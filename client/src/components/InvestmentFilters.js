import React, { useState, useEffect } from 'react';
import './InvestmentFilters.css';

const InvestmentFilters = ({ filters, investmentTypes, onFilterChange, onClearFilters }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (name, value) => {
    const newFilters = {
      ...localFilters,
      [name]: value
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(val => val !== '');

  return (
    <div className="filters-container">
      <div className="filters-header">
        <h3 className="filters-title">Filters</h3>
        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={onClearFilters}>
            Clear All
          </button>
        )}
      </div>
      <div className="filters-grid">
        <div className="filter-group">
          <label htmlFor="startDate">Start Date</label>
          <input
            type="date"
            id="startDate"
            value={localFilters.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="endDate">End Date</label>
          <input
            type="date"
            id="endDate"
            value={localFilters.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="investmentType">Investment Type</label>
          <input
            type="text"
            id="investmentType"
            value={localFilters.investmentType}
            onChange={(e) => handleChange('investmentType', e.target.value)}
            list="filter-investment-types"
            placeholder="Filter by type"
          />
          <datalist id="filter-investment-types">
            {investmentTypes.map((type, idx) => (
              <option key={idx} value={type} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  );
};

export default InvestmentFilters;

