import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Rooms.css';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomAPI.getAll();
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      alert('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) {
      alert('Please enter a room name');
      return;
    }

    try {
      setCreating(true);
      await roomAPI.create({ name: roomName.trim() });
      setRoomName('');
      setShowCreateForm(false);
      fetchRooms();
    } catch (error) {
      console.error('Error creating room:', error);
      alert(error.response?.data?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading rooms...</div>;
  }

  return (
    <div className="rooms-container">
      <div className="rooms-header">
        <h1 className="rooms-title">Rooms</h1>
        <button
          className="btn-create-room"
          onClick={() => setShowCreateForm(true)}
        >
          + Create Room
        </button>
      </div>

      {showCreateForm && (
        <div className="form-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="form-container" onClick={(e) => e.stopPropagation()}>
            <h2 className="form-title">Create New Room</h2>
            <form onSubmit={handleCreateRoom} className="create-room-form">
              <div className="form-group">
                <label htmlFor="roomName">Room Name *</label>
                <input
                  type="text"
                  id="roomName"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g., Apartment 2B, Hostel Room 304"
                  autoFocus
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowCreateForm(false);
                    setRoomName('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {rooms.length === 0 ? (
        <div className="empty-state">
          <p>No rooms yet. Create your first room to start splitting expenses!</p>
        </div>
      ) : (
        <div className="rooms-grid">
          {rooms.map((room) => (
            <div
              key={room._id}
              className="room-card"
              onClick={() => navigate(`/rooms/${room._id}`)}
            >
              <div className="room-card-header">
                <h3 className="room-card-name">{room.name}</h3>
                {(room.createdBy?._id?.toString() === user?.id?.toString() || 
                  room.createdBy?.toString() === user?.id?.toString()) && (
                  <span className="room-creator-badge">Creator</span>
                )}
              </div>
              <div className="room-card-info">
                <div className="room-info-item">
                  <span className="room-info-label">Members:</span>
                  <span className="room-info-value">{room.members?.length || 0}</span>
                </div>
                <div className="room-info-item">
                  <span className="room-info-label">Created:</span>
                  <span className="room-info-value">{formatDate(room.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Rooms;

