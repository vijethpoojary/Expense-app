const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const roomController = require('../controllers/roomController');

// Validation rules
const createRoomValidation = [
  body('name').trim().notEmpty().withMessage('Room name is required'),
];

const addMemberValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
];

router.post('/', createRoomValidation, roomController.createRoom);
router.get('/', roomController.getRooms);
router.get('/:id', roomController.getRoom);
router.post('/:id/members', addMemberValidation, roomController.addMember);
router.delete('/:id/members', roomController.removeMember);
router.delete('/:id', roomController.deleteRoom);

module.exports = router;

