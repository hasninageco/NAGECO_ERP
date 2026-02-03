const express = require('express');
const router = express.Router();
const meetingRoomController = require('../../controllers/meetingControllers/meetingRoomController');

router.get('/', meetingRoomController.getAll);
router.get('/:id', meetingRoomController.getById);
router.post('/', meetingRoomController.create);
router.put('/:id', meetingRoomController.update);
router.delete('/:id', meetingRoomController.delete);

module.exports = router;
