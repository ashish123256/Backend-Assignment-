const express = require('express');
const router = express.Router();
const bidsController = require('../controllers/bidsController.js');
const authenticateToken = require('../middleware/auth.js');

router.get('/items/:itemId/bids', bidsController.getBidsForItem);
router.post('/items/:itemId/bids', authenticateToken, bidsController.placeBid);

module.exports = router;
