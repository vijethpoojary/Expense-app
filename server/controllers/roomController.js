const Room = require('../models/Room');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Create a new room
// SECURITY: Set createdBy from authenticated token
exports.createRoom = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;
    const userId = req.user.id;
    
    // Get user info for adding as first member
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create room with creator as first member
    const room = await Room.create({
      name: name.trim(),
      createdBy: userId,
      members: [{
        userId: userId,
        email: user.email,
        name: user.email.split('@')[0], // Use email prefix as default name
        joinedAt: new Date()
      }]
    });

    res.status(201).json(room);
  } catch (error) {
    next(error);
  }
};

// Get all rooms where user is a member
// SECURITY: Only return rooms where user is a member
exports.getRooms = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    const rooms = await Room.find({
      isActive: true,
      $or: [
        { createdBy: userId },
        { 'members.userId': userId }
      ]
    })
    .populate('createdBy', 'email')
    .sort({ createdAt: -1 });

    res.json(rooms);
  } catch (error) {
    next(error);
  }
};

// Get single room by ID
// SECURITY: Verify user is a member of the room
exports.getRoom = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const roomId = req.params.id;

    const room = await Room.findOne({
      _id: roomId,
      isActive: true,
      $or: [
        { createdBy: userId },
        { 'members.userId': userId }
      ]
    }).populate('createdBy', 'email');

    if (!room) {
      return res.status(404).json({ message: 'Room not found or access denied' });
    }

    res.json(room);
  } catch (error) {
    next(error);
  }
};

// Add member to room
// SECURITY: Only room creator can add members
exports.addMember = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const roomId = req.params.id;
    const { email, name } = req.body;

    // Find room and verify user is creator
    const room = await Room.findOne({
      _id: roomId,
      createdBy: userId,
      isActive: true
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found or you are not the creator' });
    }

    // Check if email exists in User collection
    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToAdd) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    // Check if user is already a member
    const isAlreadyMember = room.members.some(
      member => member.userId.toString() === userToAdd._id.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this room' });
    }

    // Add member
    room.members.push({
      userId: userToAdd._id,
      email: userToAdd.email,
      name: name.trim() || userToAdd.email.split('@')[0],
      joinedAt: new Date()
    });

    await room.save();

    res.json(room);
  } catch (error) {
    next(error);
  }
};

// Remove member from room
// SECURITY: Only room creator can remove members
exports.removeMember = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const roomId = req.params.id;
    const { memberId } = req.body;

    // Find room and verify user is creator
    const room = await Room.findOne({
      _id: roomId,
      createdBy: userId,
      isActive: true
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found or you are not the creator' });
    }

    // Prevent removing the creator
    if (memberId === userId) {
      return res.status(400).json({ message: 'Cannot remove room creator' });
    }

    // Remove member
    room.members = room.members.filter(
      member => member.userId.toString() !== memberId
    );

    await room.save();

    res.json(room);
  } catch (error) {
    next(error);
  }
};

// Soft delete room (set isActive to false)
// SECURITY: Only room creator can delete room
exports.deleteRoom = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const roomId = req.params.id;

    const room = await Room.findOneAndUpdate(
      {
        _id: roomId,
        createdBy: userId,
        isActive: true
      },
      { isActive: false },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ message: 'Room not found or you are not the creator' });
    }

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    next(error);
  }
};

