import React, { useState, useEffect } from 'react';
import { investmentAPI } from '../services/api';
import InvestmentForm from './InvestmentForm';
import InvestmentList from './InvestmentList';
import InvestmentFilters from './InvestmentFilters';
import './Investments.css';

const Investments = () => {
  const [investments, setInvestments] = useState([]);
  const [investmentTypes, setInvestmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    investmentType: ''
  });

  useEffect(() => {
    fetchInvestments();
    fetchInvestmentTypes();
  }, [filters]);

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const response = await investmentAPI.getAll(filters);
      setInvestments(response.data);
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestmentTypes = async () => {
    try {
      const response = await investmentAPI.getTypes();
      setInvestmentTypes(response.data);
    } catch (error) {
      console.error('Error fetching investment types:', error);
    }
  };

  const handleCreate = async (investmentData) => {
    try {
      await investmentAPI.create(investmentData);
      fetchInvestments();
      fetchInvestmentTypes();
      setShowForm(false);
      // Dispatch custom event to notify Dashboard to refresh
      window.dispatchEvent(new CustomEvent('expenseUpdated'));
    } catch (error) {
      console.error('Error creating investment:', error);
      throw error;
    }
  };

  const handleUpdate = async (id, investmentData) => {
    try {
      await investmentAPI.update(id, investmentData);
      fetchInvestments();
      setEditingInvestment(null);
      // Dispatch custom event to notify Dashboard to refresh
      window.dispatchEvent(new CustomEvent('expenseUpdated'));
    } catch (error) {
      console.error('Error updating investment:', error);
      throw error;
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this investment?')) {
      try {
        await investmentAPI.delete(id);
        fetchInvestments();
        // Dispatch custom event to notify Dashboard to refresh
        window.dispatchEvent(new CustomEvent('expenseUpdated'));
      } catch (error) {
        console.error('Error deleting investment:', error);
        alert('Failed to delete investment');
      }
    }
  };

  const handleEdit = (investment) => {
    setEditingInvestment(investment);
    setShowForm(true);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      investmentType: ''
    });
  };

  const handleSelectionChange = (ids) => {
    setSelectedIds(ids);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one investment to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected investment(s)?`)) {
      return;
    }

    try {
      await investmentAPI.deleteSelected(selectedIds);
      setSelectedIds([]);
      fetchInvestments();
      window.dispatchEvent(new CustomEvent('expenseUpdated'));
      alert(`Successfully deleted ${selectedIds.length} investment(s)`);
    } catch (error) {
      console.error('Error deleting selected investments:', error);
      alert('Failed to delete selected investments');
    }
  };

  const handleDeleteAll = async () => {
    if (investments.length === 0) {
      alert('No investments to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ALL ${investments.length} investments? This action cannot be undone!`)) {
      return;
    }

    try {
      await investmentAPI.deleteAll();
      setSelectedIds([]);
      fetchInvestments();
      window.dispatchEvent(new CustomEvent('expenseUpdated'));
      alert('Successfully deleted all investments');
    } catch (error) {
      console.error('Error deleting all investments:', error);
      alert('Failed to delete all investments');
    }
  };

  return (
    <div className="investments-page">
      <div className="page-header">
        <h1 className="page-title">Investments</h1>
        <div className="header-actions">
          {selectedIds.length > 0 && (
            <button className="btn-danger" onClick={handleDeleteSelected}>
              Delete Selected ({selectedIds.length})
            </button>
          )}
          {investments.length > 0 && (
            <button className="btn-danger" onClick={handleDeleteAll}>
              Delete All
            </button>
          )}
          <button className="btn-primary" onClick={() => {
            setShowForm(true);
            setEditingInvestment(null);
          }}>
            + Add Investment
          </button>
        </div>
      </div>

      <InvestmentFilters
        filters={filters}
        investmentTypes={investmentTypes}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {showForm && (
        <InvestmentForm
          investment={editingInvestment}
          investmentTypes={investmentTypes}
          onSubmit={editingInvestment ? 
            (data) => handleUpdate(editingInvestment._id, data) : 
            handleCreate
          }
          onCancel={() => {
            setShowForm(false);
            setEditingInvestment(null);
          }}
        />
      )}

      {loading ? (
        <div className="loading">Loading investments...</div>
      ) : (
        <InvestmentList
          investments={investments}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSelectionChange={handleSelectionChange}
        />
      )}
    </div>
  );
};

export default Investments;

