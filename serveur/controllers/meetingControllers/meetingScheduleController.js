const MeetingSchedule = require('../../models/Meeting/MeetingSchedule');
const MeetingRoom = require('../../models/Meeting/MeetingRoom');
const Employee = require('../../models/hr/employee');

module.exports = {
  getEmployees: async (req, res) => {
    try {
      const employees = await Employee.findAll();
      res.json(employees);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  getAll: async (req, res) => {
    try {
      const meetings = await MeetingSchedule.findAll();
      res.json(meetings);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  getById: async (req, res) => {
    try {
      const meeting = await MeetingSchedule.findByPk(req.params.id);
      if (!meeting) return res.status(404).json({ error: 'Not found' });
      res.json(meeting);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  create: async (req, res) => {
    try {
  console.log('Received meeting POST:', req.body);
  console.log('Other_members_meeting (create):', req.body.Other_members_meeting);
      // Use user-provided values, add validation for empty date_meeting
      const meetingData = {
        date_meeting: req.body.date_meeting && req.body.date_meeting.trim() !== '' ? req.body.date_meeting : null,
        date_meeting_end: req.body.date_meeting_end && req.body.date_meeting_end.trim() !== '' ? req.body.date_meeting_end : null,
        id_room: req.body.id_room,
        members_meeting: Array.isArray(req.body.members_meeting) ? req.body.members_meeting.join(',') : req.body.members_meeting,
        Other_members_meeting: Array.isArray(req.body.Other_members_meeting) ? req.body.Other_members_meeting.join(',') : req.body.Other_members_meeting,
        comment: req.body.comment,
        creation_date: req.body.creation_date && req.body.creation_date.trim() !== '' ? req.body.creation_date : null,
        usr: req.body.usr
      };
      if (!meetingData.date_meeting) {
        // Optionally, you can set a default value or handle as needed
        // meetingData.date_meeting = 'No date selected';
        // Or skip insert, or return error
        // return res.status(400).json({ error: 'date_meeting is required' });
      }
      const meeting = await MeetingSchedule.create(meetingData);
      res.status(201).json(meeting);
    } catch (err) {
      
      res.status(400).json({ error: err.message });
    }
  },
  update: async (req, res) => {
  console.log('Received meeting UPDATE:', req.body);
  console.log('Other_members_meeting (update):', req.body.Other_members_meeting);
    try {
      const meeting = await MeetingSchedule.findByPk(req.params.id);
      if (!meeting) return res.status(404).json({ error: 'Not found' });
      await meeting.update({
        ...req.body,
        id_room: req.body.id_room,
        Other_members_meeting: Array.isArray(req.body.Other_members_meeting) ? req.body.Other_members_meeting.join(',') : req.body.Other_members_meeting
      });
      res.json(meeting);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  getRooms: async (req, res) => {
    try {
      const rooms = await MeetingRoom.findAll();
      res.json(rooms);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  delete: async (req, res) => {
    try {
      const meeting = await MeetingSchedule.findByPk(req.params.id);
      if (!meeting) return res.status(404).json({ error: 'Not found' });
      await meeting.destroy();
      res.json({ message: 'Deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
