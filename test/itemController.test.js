const { mockDeep } = require('jest-mock-extended');
const { getAllItems, getItemById, createItem, updateItem, deleteItem } = require('../controllers/itemsController.js'); 

const pool = mockDeep();
jest.mock('../models/db.js', () => pool);

describe('Items Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            query: {},
            params: {},
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('getAllItems', () => {
        it('should retrieve all items with pagination', async () => {
            req.query = { page: 1, limit: 10 };
            const items = [{ id: 1, name: 'Item1' }, { id: 2, name: 'Item2' }];
            pool.query.mockResolvedValue({ rows: items });

            await getAllItems(req, res);

            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM items LIMIT $1 OFFSET $2', [10, 0]);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(items[0]);
        });

        it('should return 500 on database error', async () => {
            req.query = { page: 1, limit: 10 };
            const error = new Error('Database error');
            pool.query.mockRejectedValue(error);

            await getAllItems(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
        });
    });

    describe('getItemById', () => {
        it('should retrieve a single item by ID', async () => {
            req.params.id = 1;
            const item = { id: 1, name: 'Item1' };
            pool.query.mockResolvedValue({ rows: [item] });

            await getItemById(req, res);

            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM items WHERE id = $1', [1]);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(item);
        });

        it('should return 404 if item not found', async () => {
            req.params.id = 1;
            pool.query.mockResolvedValue({ rows: [] });

            await getItemById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Item not found' });
        });

        it('should return 500 on database error', async () => {
            req.params.id = 1;
            const error = new Error('Database error');
            pool.query.mockRejectedValue(error);

            await getItemById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
        });
    });

    describe('createItem', () => {
        it('should create a new item', async () => {
            req.body = {
                name: 'NewItem',
                description: 'A new item',
                starting_price: 100,
                current_price: 100,
                image_url: 'http://example.com/image.jpg',
                end_time: '2024-12-31'
            };
            const newItem = { id: 1, ...req.body };
            pool.query.mockResolvedValue({ rows: [newItem] });

            await createItem(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO items (name, description, starting_price, current_price, image_url, end_time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                ['NewItem', 'A new item', 100, 100, 'http://example.com/image.jpg', '2024-12-31']
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(newItem);
        });

        it('should return 500 on database error', async () => {
            req.body = {
                name: 'NewItem',
                description: 'A new item',
                starting_price: 100,
                current_price: 100,
                image_url: 'http://example.com/image.jpg',
                end_time: '2024-12-31'
            };
            const error = new Error('Database error');
            pool.query.mockRejectedValue(error);

            await createItem(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
        });
    });

    describe('updateItem', () => {
        it('should update an item by ID', async () => {
            req.params.id = 1;
            req.body = {
                name: 'UpdatedItem',
                description: 'An updated item',
                starting_price: 150,
                current_price: 150,
                image_url: 'http://example.com/image.jpg',
                end_time: '2024-12-31'
            };
            const updatedItem = { id: 1, ...req.body };
            pool.query.mockResolvedValue({ rows: [updatedItem] });

            await updateItem(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                'UPDATE items SET name = $1, description = $2, starting_price = $3, current_price = $4, image_url = $5, end_time = $6 WHERE id = $7 RETURNING *',
                ['UpdatedItem', 'An updated item', 150, 150, 'http://example.com/image.jpg', '2024-12-31', 1]
            );
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.json).toHaveBeenCalledWith(updatedItem);
        });

        it('should return 404 if item not found', async () => {
            req.params.id = 1;
            req.body = {
                name: 'UpdatedItem',
                description: 'An updated item',
                starting_price: 150,
                current_price: 150,
                image_url: 'http://example.com/image.jpg',
                end_time: '2024-12-31'
            };
            pool.query.mockResolvedValue({ rows: [] });

            await updateItem(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Item not found' });
        });

        it('should return 500 on database error', async () => {
            req.params.id = 1;
            req.body = {
                name: 'UpdatedItem',
                description: 'An updated item',
                starting_price: 150,
                current_price: 150,
                image_url: 'http://example.com/image.jpg',
                end_time: '2024-12-31'
            };
            const error = new Error('Database error');
            pool.query.mockRejectedValue(error);

            await updateItem(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ err: 'Database error' });
        });
    });

    describe('deleteItem', () => {
        it('should delete an item by ID', async () => {
            req.params.id = 1;
            const deletedItem = { id: 1, name: 'DeletedItem' };
            pool.query.mockResolvedValue({ rows: [deletedItem] });

            await deleteItem(req, res);

            expect(pool.query).toHaveBeenCalledWith('DELETE FROM items WHERE id = $1 RETURNING *', [1]);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Deleted Successfully', deletedItem });
        });

        it('should return 404 if item not found', async () => {
            req.params.id = 1;
            pool.query.mockResolvedValue({ rows: [] });

            await deleteItem(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Item not found' });
        });

        it('should return 500 on database error', async () => {
            req.params.id = 1;
            const error = new Error('Database error');
            pool.query.mockRejectedValue(error);

            await deleteItem(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
        });
    });
});
