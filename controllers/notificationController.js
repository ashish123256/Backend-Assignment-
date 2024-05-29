const pool  = require("../models/db.js");

// Retrieve notifications for the logged-in user
exports.getNotifications = async (req, res) => {
     const user_id = req.user.id;
    try {
        const notifications = await pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
        res.status(200).json(notifications.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Mark notifications as read
exports.markRead = async (req, res) => {
    try {
       
        const notificationIds = req.body.notificationIds;
        const user_id = req.user.id;

        // Update existing notifications (assuming there's an 'is_read' column)
        const updateQuery = `UPDATE notifications SET is_read = true WHERE user_id = $1 AND id = ANY($2::int[])`;
        const markRead = await pool.query(updateQuery, [user_id, notificationIds]);

        res.status(200).json({ message: "Notifications marked as read successfully", markRead: markRead.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
