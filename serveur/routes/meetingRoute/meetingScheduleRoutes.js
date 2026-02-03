const express = require('express');
const router = express.Router();
const meetingScheduleController = require('../../controllers/meetingControllers/meetingScheduleController');

router.get('/', meetingScheduleController.getAll);
router.get('/rooms', meetingScheduleController.getRooms);
router.get('/:id', meetingScheduleController.getById);
router.post('/', meetingScheduleController.create);
router.put('/:id', meetingScheduleController.update);
router.delete('/:id', meetingScheduleController.delete);

module.exports = router;
