import React, { useState, useEffect } from 'react';
import { expenseAPI } from '../services/api';
import { useIsMobile } from '../hooks/useWindowSize';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import ExpenseFilters from './ExpenseFilters';
import FAB from './FAB';
import './Expenses.css';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    sourceType: ''
  });

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, [filters]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await expenseAPI.getAll(filters);
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await expenseAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreate = async (expenseData) => {
    try {
      await expenseAPI.create(expenseData);
      fetchExpenses();
      fetchCategories();
      setShowForm(false);
      // Dispatch custom event to notify Dashboard to refresh
      window.dispatchEvent(new CustomEvent('expenseUpdated'));
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  };

  const handleUpdate = async (id, expenseData) => {
    try {
      await expenseAPI.update(id, expenseData);
      fetchExpenses();
      setEditingExpense(null);
      // Dispatch custom event to notify Dashboard to refresh
      window.dispatchEvent(new CustomEvent('expenseUpdated'));
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expenseAPI.delete(id);
        fetchExpenses();
        // Dispatch custom event to notify Dashboard to refresh
        window.dispatchEvent(new CustomEvent('expenseUpdated'));
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Failed to delete expense');
      }
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      category: '',
      sourceType: ''
    });
  };

  const handleSelectionChange = (ids) => {
    setSelectedIds(ids);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one expense to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected expense(s)?`)) {
      return;
    }

    try {
      await expenseAPI.deleteSelected(selectedIds);
      setSelectedIds([]);
      fetchExpenses();
      window.dispatchEvent(new CustomEvent('expenseUpdated'));
      alert(`Successfully deleted ${selectedIds.length} expense(s)`);
    } catch (error) {
      console.error('Error deleting selected expenses:', error);
      alert('Failed to delete selected expenses');
    }
  };

  const handleDeleteAll = async () => {
    if (expenses.length === 0) {
      alert('No expenses to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ALL ${expenses.length} expenses? This action cannot be undone!`)) {
      return;
    }

    try {
      await expenseAPI.deleteAll();
      setSelectedIds([]);
      fetchExpenses();
      window.dispatchEvent(new CustomEvent('expenseUpdated'));
      alert('Successfully deleted all expenses');
    } catch (error) {
      console.error('Error deleting all expenses:', error);
      alert('Failed to delete all expenses');
    }
  };

  return (
    <div className="expenses-page">
      <div className="page-header">
        <h1 className="page-title">Expenses</h1>
        {!isMobile && (
          <div className="header-actions">
            {selectedIds.length > 0 && (
              <button className="btn-danger" onClick={handleDeleteSelected}>
                Delete Selected ({selectedIds.length})
              </button>
            )}
            {expenses.length > 0 && (
              <button className="btn-danger" onClick={handleDeleteAll}>
                Delete All
              </button>
            )}
            <button className="btn-primary" onClick={() => {
              setShowForm(true);
              setEditingExpense(null);
            }}>
              + Add Expense
            </button>
          </div>
        )}
        {isMobile && (
          <div className="mobile-header-actions">
            <button 
              className="btn-icon" 
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Toggle filters"
            >
              🔍
            </button>
            {selectedIds.length > 0 && (
              <button className="btn-icon btn-danger-icon" onClick={handleDeleteSelected}>
                🗑️
              </button>
            )}
          </div>
        )}
      </div>

      {isMobile && showFilters && (
        <div className="mobile-filters-drawer">
          <ExpenseFilters
            filters={filters}
            categories={categories}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
          <button className="btn-close-filters" onClick={() => setShowFilters(false)}>
            Close Filters
          </button>
        </div>
      )}

      {!isMobile && (
        <ExpenseFilters
          filters={filters}
          categories={categories}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      )}

      {isMobile && selectedIds.length > 0 && (
        <div className="mobile-bulk-actions">
          <button className="btn-danger" onClick={handleDeleteSelected}>
            Delete Selected ({selectedIds.length})
          </button>
          {expenses.length > 0 && (
            <button className="btn-danger" onClick={handleDeleteAll}>
              Delete All
            </button>
          )}
        </div>
      )}

      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          categories={categories}
          onSubmit={editingExpense ? 
            (data) => handleUpdate(editingExpense._id, data) : 
            handleCreate
          }
          onCancel={() => {
            setShowForm(false);
            setEditingExpense(null);
          }}
        />
      )}

      {loading ? (
        <div className="loading">Loading expenses...</div>
      ) : (
        <ExpenseList
          expenses={expenses}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSelectionChange={handleSelectionChange}
        />
      )}

      {isMobile && (
        <FAB
          onClick={() => {
            setShowForm(true);
            setEditingExpense(null);
          }}
          icon="+"
          aria-label="Add expense"
        />
      )}
    </div>
  );
};

export default Expenses;

