import React, { useState, useEffect } from 'react';
import { salaryAPI, analyticsAPI } from '../services/api';
import './Dashboard.css';
import StatCard from './StatCard';
import SalaryCard from './SalaryCard';

const Dashboard = () => {
  const [salaryStats, setSalaryStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [salaryRes, analyticsRes] = await Promise.all([
        salaryAPI.getStats(),
        analyticsAPI.getAnalytics()
      ]);
      setSalaryStats(salaryRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Dashboard</h1>
      
      {salaryStats && <SalaryCard salaryStats={salaryStats} onUpdate={fetchDashboardData} />}

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

