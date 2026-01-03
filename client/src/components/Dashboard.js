import React, { useState, useEffect } from 'react';
import { salaryAPI, analyticsAPI } from '../services/api';
import './Dashboard.css';
import StatCard from './StatCard';
import SalaryCard from './SalaryCard';

const Dashboard = () => {
  const [salaryStats, setSalaryStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthlySalary, setMonthlySalary] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);


  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [salaryRes, analyticsRes, salaryInfoRes] = await Promise.all([
        salaryAPI.getStats(),
        analyticsAPI.getAnalytics(),
        salaryAPI.get()
      ]);
      setSalaryStats(salaryRes.data);
      setAnalytics(analyticsRes.data);
      if (salaryInfoRes.data?.monthlySalary !== undefined) {
        setMonthlySalary(salaryInfoRes.data.monthlySalary);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSalary = async () => {
    try {
      setSaving(true);
      await salaryAPI.update({
        monthlySalary: parseFloat(monthlySalary) || 0
      });
      await fetchDashboardData();
    } catch (error) {
      console.error('Error updating salary:', error);
      alert('Failed to update salary');
    } finally {
      setSaving(false);
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm('Are you sure you want to reset all data? This will set salary to 0 and reset all tracking.')) {
      return;
    }
    try {
      await salaryAPI.resetAll();
      await fetchDashboardData();
      alert('All data has been reset successfully');
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('Failed to reset data');
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Dashboard</h1>
      
      {/* Salary Input Section at Top */}
      <div className="salary-input-section">
        <div className="salary-input-group">
          <label>
            Monthly Salary (₹)
            <input
              type="number"
              value={monthlySalary}
              onChange={(e) => setMonthlySalary(e.target.value)}
              min="0"
              step="1000"
              placeholder="Enter monthly salary"
              disabled={saving}
            />
          </label>
          <button 
            className="save-salary-btn" 
            onClick={handleSaveSalary}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        <button className="reset-all-btn" onClick={handleResetAll}>
          Reset All
        </button>
      </div>
      
      {salaryStats && <SalaryCard salaryStats={salaryStats} />}

      <div className="analytics-section">
        <h2 className="section-title">Expense Analytics</h2>
        <div className="stats-grid">
          <StatCard
            title="Overall Expenses"
            today={analytics?.expenses?.overall?.today || 0}
            week={analytics?.expenses?.overall?.week || 0}
            month={analytics?.expenses?.overall?.month || 0}
            color="var(--primary-color)"
          />
          <StatCard
            title="Salary Expenses"
            today={analytics?.expenses?.salary?.today || 0}
            week={analytics?.expenses?.salary?.week || 0}
            month={analytics?.expenses?.salary?.month || 0}
            color="var(--warning-color)"
          />
          <StatCard
            title="Other Expenses"
            today={analytics?.expenses?.other?.today || 0}
            week={analytics?.expenses?.other?.week || 0}
            month={analytics?.expenses?.other?.month || 0}
            color="var(--success-color)"
          />
        </div>
      </div>

      <div className="analytics-section">
        <h2 className="section-title">Investment Analytics</h2>
        <div className="stats-grid">
          <StatCard
            title="Investments"
            today={analytics?.investments?.today || 0}
            week={analytics?.investments?.week || 0}
            month={analytics?.investments?.month || 0}
            color="var(--success-color)"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

