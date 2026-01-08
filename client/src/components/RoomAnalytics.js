import React, { useState, useEffect } from 'react';
import { roomExpenseAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './RoomAnalytics.css';

const RoomAnalytics = ({ analytics, roomId, room, onReset }) => {
  const [debtBreakdown, setDebtBreakdown] = useState(null);
  const [loadingDebt, setLoadingDebt] = useState(true);
  const [resetting, setResetting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (roomId) {
      fetchDebtBreakdown();
    }
  }, [roomId]);

  const fetchDebtBreakdown = async () => {
    try {
      setLoadingDebt(true);
      const response = await roomExpenseAPI.getDebtBreakdown(roomId);
      setDebtBreakdown(response.data);
    } catch (error) {
      console.error('Error fetching debt breakdown:', error);
    } finally {
      setLoadingDebt(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isRoomCreator = room?.createdBy?.toString() === user?.id?.toString() || 
                        room?.createdBy?._id?.toString() === user?.id?.toString();

  const handleResetAll = async () => {
    if (!window.confirm('Are you sure you want to reset all expenses for this room? This will delete ALL expenses (including history) and cannot be undone!')) {
      return;
    }

    if (!window.confirm('This action is permanent. All expense data will be lost. Are you absolutely sure?')) {
      return;
    }

    try {
      setResetting(true);
      await roomExpenseAPI.resetAll(roomId);
      if (onReset) {
        onReset();
      }
      alert('All expenses have been reset successfully');
    } catch (error) {
      console.error('Error resetting expenses:', error);
      alert(error.response?.data?.message || 'Failed to reset expenses');
    } finally {
      setResetting(false);
    }
  };

  if (!analytics) {
    return <div className="loading">Loading analytics...</div>;
  }

  return (
    <div className="room-analytics">
      <div className="analytics-header">
        <h3 className="analytics-title">Room Analytics</h3>
        {isRoomCreator && (
          <button
            className="btn-reset-all"
            onClick={handleResetAll}
            disabled={resetting}
          >
            {resetting ? 'Resetting...' : '🔄 Reset All'}
          </button>
        )}
      </div>
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-card-label">Today's Total</div>
          <div className="analytics-card-value">{formatCurrency(analytics.today)}</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-label">This Week's Total</div>
          <div className="analytics-card-value">{formatCurrency(analytics.week)}</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-label">This Month's Total</div>
          <div className="analytics-card-value">{formatCurrency(analytics.month)}</div>
        </div>
        <div className="analytics-card highlight">
          <div className="analytics-card-label">You Paid</div>
          <div className="analytics-card-value positive">{formatCurrency(analytics.userPaid)}</div>
        </div>
        <div className="analytics-card highlight">
          <div className="analytics-card-label">Total Pending</div>
          <div className="analytics-card-value negative">{formatCurrency(analytics.userOwed || 0)}</div>
        </div>
      </div>

      {debtBreakdown && (
        <div className="debt-breakdown-section">
          <h4 className="debt-breakdown-title">Your Pending Payments</h4>
          {loadingDebt ? (
            <div className="loading">Loading...</div>
          ) : debtBreakdown.breakdown && debtBreakdown.breakdown.length > 0 ? (
            <div className="debt-breakdown-list">
              {debtBreakdown.breakdown.map((item) => (
                <div key={item.userId} className="debt-breakdown-item">
                  <span className="debt-member-name">To {item.name}:</span>
                  <span className={`debt-amount ${item.amount > 0 ? 'pending' : 'paid'}`}>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
              <div className="debt-breakdown-total">
                <span className="debt-total-label">Total Pending:</span>
                <span className="debt-total-amount">{formatCurrency(debtBreakdown.totalPending || 0)}</span>
              </div>
            </div>
          ) : (
            <div className="debt-breakdown-empty">
              <p>No pending payments</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoomAnalytics;

