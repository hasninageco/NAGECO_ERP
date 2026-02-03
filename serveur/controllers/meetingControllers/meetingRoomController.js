const MeetingRoom = require('../../models/Meeting/MeetingRoom');

module.exports = {
  getAll: async (req, res) => {
    try {
      const rooms = await MeetingRoom.findAll();
      res.json(rooms);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  getById: async (req, res) => {
    try {
      const room = await MeetingRoom.findByPk(req.params.id);
      if (!room) return res.status(404).json({ error: 'Not found' });
      res.json(room);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  create: async (req, res) => {
    try {
      const room = await MeetingRoom.create(req.body);
      res.status(201).json(room);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const room = await MeetingRoom.findByPk(req.params.id);


     
      if (!room) return res.status(404).json({ error: 'Not found' });
      await room.update(req.body);
      res.json(room);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
  delete: async (req, res) => {
    try {
      const room = await MeetingRoom.findByPk(req.params.id);
      if (!room) return res.status(404).json({ error: 'Not found' });
      await room.destroy();
      res.json({ message: 'Deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
