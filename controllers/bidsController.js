const pool = require('../models/db.js');


// Retrieve all bids for a specific item
exports.getBidsForItem = async (req, res) => {
    const { itemId } = req.params;

    try {
        const bids = await pool.query('SELECT * FROM bids WHERE item_id = $1 ORDER BY created_at DESC', [itemId]);
        res.status(200).json(bids.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Place a new bid on a specific item
exports.placeBid = async (req, res) => {
    const { itemId } = req.params;
    const { bid_amount } = req.body;
    const user_id = req.user.id;

    try {
        const newBid = await pool.query(
            'INSERT INTO bids (item_id, user_id, bid_amount) VALUES ($1, $2, $3) RETURNING *',
            [itemId, user_id, bid_amount]
        );

        res.status(201).json(newBid.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};