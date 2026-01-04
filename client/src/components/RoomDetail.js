import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomAPI, roomExpenseAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useWindowSize';
import RoomAnalytics from './RoomAnalytics';
import RoomExpenseForm from './RoomExpenseForm';
import RoomExpenseHistory from './RoomExpenseHistory';
import FAB from './FAB';
import './RoomDetail.css';

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [room, setRoom] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberName, setMemberName] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    fetchRoomData();
  }, [id]);

  const fetchRoomData = async () => {
    try {
      setLoading(true);
      const [roomRes, analyticsRes, expensesRes] = await Promise.all([
        roomAPI.getById(id),
        roomExpenseAPI.getAnalytics(id),
        roomExpenseAPI.getByRoom(id)
      ]);
      setRoom(roomRes.data);
      setAnalytics(analyticsRes.data);
      setExpenses(expensesRes.data);
    } catch (error) {
      console.error('Error fetching room data:', error);
      if (error.response?.status === 404) {
        alert('Room not found');
        navigate('/rooms');
      } else {
        alert('Failed to load room data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (expenseData) => {
    try {
      await roomExpenseAPI.create(expenseData);
      setShowExpenseForm(false);
      fetchRoomData();
    } catch (error) {
      console.error('Error creating expense:', error);
      alert(error.response?.data?.message || 'Failed to create expense');
      throw error;
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim() || !memberName.trim()) {
      alert('Please enter both email and name');
      return;
    }

    try {
      setAddingMember(true);
      await roomAPI.addMember(id, {
        email: memberEmail.trim(),
        name: memberName.trim()
      });
      setMemberEmail('');
      setMemberName('');
      setShowAddMemberForm(false);
      fetchRoomData();
    } catch (error) {
      console.error('Error adding member:', error);
      alert(error.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      await roomAPI.removeMember(id, { memberId });
      fetchRoomData();
    } catch (error) {
      console.error('Error removing member:', error);
      alert(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const isRoomCreator = room?.createdBy?.toString() === user?.id?.toString() || 
                        room?.createdBy?._id?.toString() === user?.id?.toString();

  if (loading) {
    return <div className="loading">Loading room...</div>;
  }

  if (!room) {
    return <div className="loading">Room not found</div>;
  }

  return (
    <div className="room-detail-container">
      <div className="room-detail-header">
        <button className="btn-back" onClick={() => navigate('/rooms')}>
          ← Back to Rooms
        </button>
        <h1 className="room-detail-title">{room.name}</h1>
      </div>

      <RoomAnalytics analytics={analytics} />

      <div className="room-detail-section">
        <div className="section-header">
          <h2 className="section-title">Members</h2>
          {isRoomCreator && (
            <button
              className="btn-add-member"
              onClick={() => setShowAddMemberForm(true)}
            >
              + Add Member
            </button>
          )}
        </div>
        <div className="members-list">
          {room.members?.map((member) => {
            const isCurrentUser = member.userId?.toString() === user?.id?.toString();
            const isCreator = member.userId?.toString() === room.createdBy?.toString() ||
                              member.userId?.toString() === room.createdBy?._id?.toString();
            return (
              <div key={member.userId?.toString() || member._id} className="member-card">
                <div className="member-info">
                  <div className="member-name-row">
                    <span className="member-name">{member.name}</span>
                    {isCurrentUser && <span className="member-badge you">You</span>}
                    {isCreator && <span className="member-badge creator">Creator</span>}
                  </div>
                  <span className="member-email">{member.email}</span>
                </div>
                {isRoomCreator && !isCreator && (
                  <button
                    className="btn-remove-member"
                    onClick={() => handleRemoveMember(member.userId?.toString() || member._id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="room-detail-section">
        <div className="section-header">
          <h2 className="section-title">Expense History</h2>
          {!isMobile && (
            <button
              className="btn-add-expense"
              onClick={() => setShowExpenseForm(true)}
            >
              + Add Expense
            </button>
          )}
        </div>
        <RoomExpenseHistory
          expenses={expenses}
          room={room}
          currentUserId={user?.id}
          onUpdateStatus={fetchRoomData}
        />
      </div>

      {showExpenseForm && (
        <RoomExpenseForm
          room={room}
          onSubmit={handleCreateExpense}
          onCancel={() => setShowExpenseForm(false)}
        />
      )}

      {showAddMemberForm && (
        <div className="form-overlay" onClick={() => setShowAddMemberForm(false)}>
          <div className="form-container" onClick={(e) => e.stopPropagation()}>
            <h2 className="form-title">Add Roommate</h2>
            <form onSubmit={handleAddMember} className="add-member-form">
              <div className="form-group">
                <label htmlFor="memberEmail">Email *</label>
                <input
                  type="email"
                  id="memberEmail"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="roommate@example.com"
                  autoFocus
                />
                <small className="form-hint">User must have an account with this email</small>
              </div>
              <div className="form-group">
                <label htmlFor="memberName">Name *</label>
                <input
                  type="text"
                  id="memberName"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Roommate Name"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-submit" disabled={addingMember}>
                  {addingMember ? 'Adding...' : 'Add'}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowAddMemberForm(false);
                    setMemberEmail('');
                    setMemberName('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <FAB onClick={() => setShowExpenseForm(true)} />
    </div>
  );
};

export default RoomDetail;

