const AdministrationArchive = require("../../models/archive/AdministrationArchive");

module.exports = {
	getAll: async (_req, res) => {
		try {
			const rows = await AdministrationArchive.findAll();
			res.json(rows);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	},

	getById: async (req, res) => {
		try {
			const row = await AdministrationArchive.findOne({
				where: {
					_ADMINISTRATION_ID: req.params.id,
				},
			});

			if (!row) {
				return res.status(404).json({ error: "Not found" });
			}

			res.json(row);
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	},

	create: async (req, res) => {
		try {
			const row = await AdministrationArchive.create(req.body);
			res.status(201).json(row);
		} catch (err) {
			res.status(400).json({ error: err.message });
		}
	},

	update: async (req, res) => {
		try {
			const row = await AdministrationArchive.findOne({
				where: {
					_ADMINISTRATION_ID: req.params.id,
				},
			});

			if (!row) {
				return res.status(404).json({ error: "Not found" });
			}

			await row.update(req.body);
			res.json(row);
		} catch (err) {
			res.status(400).json({ error: err.message });
		}
	},

	delete: async (req, res) => {
		try {
			const row = await AdministrationArchive.findOne({
				where: {
					_ADMINISTRATION_ID: req.params.id,
				},
			});

			if (!row) {
				return res.status(404).json({ error: "Not found" });
			}

			await row.destroy();
			res.json({ message: "Deleted" });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	},
};
