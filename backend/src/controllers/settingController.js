const db = require('../config/db');

async function getSettings(req, res) {
  try {
    const { rows } = await db.query('SELECT * FROM settings');
    const settingsMap = {};
    rows.forEach(r => {
      settingsMap[r.key] = r.value;
    });

    return res.json({
      settings: {
        high_threshold: parseFloat(settingsMap.high_threshold || '75'),
        low_threshold: parseFloat(settingsMap.low_threshold || '60'),
        late_weight: parseFloat(settingsMap.late_weight || '0.5')
      }
    });
  } catch (err) {
    console.error('Get Settings Error:', err);
    return res.status(500).json({ message: 'Error fetching settings.' });
  }
}

async function updateSettings(req, res) {
  try {
    const { high_threshold, low_threshold, late_weight } = req.body;

    if (high_threshold !== undefined) {
      await db.query('INSERT INTO settings (key, value) VALUES ($1, $2)', ['high_threshold', String(high_threshold)]);
    }
    if (low_threshold !== undefined) {
      await db.query('INSERT INTO settings (key, value) VALUES ($1, $2)', ['low_threshold', String(low_threshold)]);
    }
    if (late_weight !== undefined) {
      await db.query('INSERT INTO settings (key, value) VALUES ($1, $2)', ['late_weight', String(late_weight)]);
    }

    return res.json({ message: 'Settings updated successfully.' });
  } catch (err) {
    console.error('Update Settings Error:', err);
    return res.status(500).json({ message: 'Failed to update settings.' });
  }
}

module.exports = {
  getSettings,
  updateSettings
};
