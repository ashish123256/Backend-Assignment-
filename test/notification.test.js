const { mockDeep } = require('jest-mock-extended');
const { getNotifications, markRead } = require('../controllers/notificationController.js'); 

const pool = mockDeep();
jest.mock('../models/db.js', () => pool);

describe('Notifications Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: { id: 1 },
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('getNotifications', () => {
        it('should retrieve notifications for the logged-in user', async () => {
            const notifications = [{ id: 1, user_id: 1, message: 'Notification 1', created_at: '2024-01-01' }];
            pool.query.mockResolvedValue({ rows: notifications });

            await getNotifications(req, res);

            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [1]);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(notifications);
        });

        it('should return 500 on database error', async () => {
            const error = new Error('Database error');
            pool.query.mockRejectedValue(error);

            await getNotifications(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
        });
    });

    describe('markRead', () => {
        it('should mark notifications as read', async () => {
            req.body.notificationIds = [1, 2, 3];
            const markReadResponse = { rows: [{ id: 1, user_id: 1, is_read: true }] };
            pool.query.mockResolvedValue(markReadResponse);

            await markRead(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                'UPDATE notifications SET is_read = true WHERE user_id = $1 AND id = ANY($2::int[])',
                [1, [1, 2, 3]]
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Notifications marked as read successfully', markRead: markReadResponse.rows });
        });

        it('should return 500 on database error', async () => {
            const error = new Error('Database error');
            pool.query.mockRejectedValue(error);

            await markRead(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
        });
    });
});
