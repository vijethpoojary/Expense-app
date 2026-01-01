import React, { useState, useEffect } from 'react';
import './ExpenseFilters.css';

const ExpenseFilters = ({ filters, categories, onFilterChange, onClearFilters }) => {
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
          <label htmlFor="category">Category</label>
          <input
            type="text"
            id="category"
            value={localFilters.category}
            onChange={(e) => handleChange('category', e.target.value)}
            list="filter-categories"
            placeholder="Filter by category"
          />
          <datalist id="filter-categories">
            {categories.map((cat, idx) => (
              <option key={idx} value={cat} />
            ))}
          </datalist>
        </div>

        <div className="filter-group">
          <label htmlFor="sourceType">Source Type</label>
          <select
            id="sourceType"
            value={localFilters.sourceType}
            onChange={(e) => handleChange('sourceType', e.target.value)}
          >
            <option value="">All</option>
            <option value="salary">Salary</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ExpenseFilters;

