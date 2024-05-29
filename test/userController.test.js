const { mockDeep } = require('jest-mock-extended');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { register, login, profile } = require('../controllers/usersController.js'); 

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const pool = mockDeep();
jest.mock('../models/db.js', () => pool);

describe('User Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {},
            user: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            req.body = { username: 'testuser', password: 'password123', email: 'test@example.com' };
            const hashedPassword = 'hashedpassword';
            bcrypt.hash.mockResolvedValue(hashedPassword);
            pool.query.mockResolvedValue({ rows: [{ id: 1, username: 'testuser', email: 'test@example.com' }] });

            await register(req, res);

            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING *',
                ['testuser', hashedPassword, 'test@example.com']
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ id: 1, username: 'testuser', email: 'test@example.com' });
        });

        it('should return 400 if username already exists', async () => {
            req.body = { username: 'testuser', password: 'password123', email: 'test@example.com' };
            const error = new Error('Username already exists.');
            error.code = '23505';
            pool.query.mockRejectedValue(error);

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Username already exists.' });
        });

        it('should return 500 on other errors', async () => {
            req.body = { username: 'testuser', password: 'password123', email: 'test@example.com' };
            const error = new Error('Database error');
            pool.query.mockRejectedValue(error);

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ err: 'Database error' });
        });
    });

    describe('login', () => {
        it('should authenticate a user successfully', async () => {
            req.body = { username: 'testuser', password: 'password123' };
            const user = { id: 1, username: 'testuser', password: 'hashedpassword', role: 'user' };
            pool.query.mockResolvedValue({ rows: [user] });
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token');

            await login(req, res);

            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE username = $1', ['testuser']);
            expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
            expect(jwt.sign).toHaveBeenCalledWith({ id: 1, role: 'user' }, process.env.JWT_SECRET);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ token: 'token', user });
        });

        it('should return 400 if user not found', async () => {
            req.body = { username: 'testuser', password: 'password123' };
            pool.query.mockResolvedValue({ rows: [] });

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
        });

        it('should return 400 if password is invalid', async () => {
            req.body = { username: 'testuser', password: 'password123' };
            const user = { id: 1, username: 'testuser', password: 'hashedpassword', role: 'user' };
            pool.query.mockResolvedValue({ rows: [user] });
            bcrypt.compare.mockResolvedValue(false);

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
        });

        it('should return 500 on other errors', async () => {
            req.body = { username: 'testuser', password: 'password123' };
            const error = new Error('Database error');
            pool.query.mockRejectedValue(error);

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
        });
    });

    describe('profile', () => {
        it('should get the profile of the logged-in user', async () => {
            req.user.id = 1;
            const user = { id: 1, username: 'testuser', email: 'test@example.com', role: 'user', created_at: '2023-01-01' };
            pool.query.mockResolvedValue({ rows: [user] });

            await profile(req, res);

            expect(pool.query).toHaveBeenCalledWith('SELECT id, username, email, role, created_at FROM users WHERE id = $1', [1]);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(user);
        });

        it('should return 500 on error', async () => {
            req.user.id = 1;
            const error = new Error('Database error');
            pool.query.mockRejectedValue(error);

            await profile(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
        });
    });
});
