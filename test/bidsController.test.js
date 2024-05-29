const { mockDeep } = require('jest-mock-extended');
const { getBidsForItem, placeBid } = require('../controllers/bidsController.js'); 

const pool = mockDeep();
jest.mock('../models/db.js', () => pool);

describe('Bids Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            params: {},
            body: {},
            user: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('getBidsForItem', () => {
        it('should retrieve all bids for a specific item', async () => {
            req.params.itemId = 1;
            const bids = [{ id: 1, item_id: 1, user_id: 1, bid_amount: 100, created_at: '2024-01-01' }];
            pool.query.mockResolvedValue({ rows: bids });

            await getBidsForItem(req, res);

            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM bids WHERE item_id = $1 ORDER BY created_at DESC', [1]);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(bids);
        });

        it('should return 500 on database error', async () => {
            req.params.itemId = 1;
            const error = new Error('Database error');
            pool.query.mockRejectedValue(error);

            await getBidsForItem(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
        });
    });

    describe('placeBid', () => {
        it('should place a new bid on a specific item', async () => {
            req.params.itemId = 1;
            req.body.bid_amount = 200;
            req.user.id = 1;
            const newBid = { id: 1, item_id: 1, user_id: 1, bid_amount: 200, created_at: '2024-01-01' };
            pool.query.mockResolvedValue({ rows: [newBid] });

            await placeBid(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO bids (item_id, user_id, bid_amount) VALUES ($1, $2, $3) RETURNING *',
                [1, 1, 200]
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(newBid);
        });

        it('should return 500 on database error', async () => {
            req.params.itemId = 1;
            req.body.bid_amount = 200;
            req.user.id = 1;
            const error = new Error('Database error');
            pool.query.mockRejectedValue(error);

            await placeBid(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
        });
    });
});
