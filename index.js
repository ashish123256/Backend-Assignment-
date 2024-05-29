const express = require("express");
const dotenv = require('dotenv');
const userRoutes = require('./routes/users.js');
const itemsRoutes = require("./routes/items.js");
const bidsRoutes = require("./routes/bids.js");
const notificationsRoutes = require("./routes/notifcation.js");

const http = require('http');
const socketIo = require('socket.io');
const pool = require('./models/db.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);


dotenv.config();

const PORT = process.env.PORT;

app.use(express.json());

//routes
app.use('/users', userRoutes);
app.use('/items', itemsRoutes);
app.use("/", bidsRoutes);
app.use('/notifications', notificationsRoutes);

// webSocket events
io.on('connection', (socket) => {
    console.log('New Client connected');

    //place a new bid  on an item
    socket.on('placeBid', async (data) => {
        const { itemId, user_id, bid_amount } = data;
        try {
            const newBid = await pool.query(
                'INSERT INTO bids (itemId, user_id, bid_amount) VALUES ($1, $2, $3) RETURNING *',
                [itemId, user_id, bid_amount]
            );
            io.emit('update', newBid.rows[0]);
        }
        catch (err) {
            console.error(`Error placing bid: ${err.message}`);
            socket.emit('error', { error: err.message });
        }
    });

    // Event: Send notifications to users in real-time
    socket.on('mark-read', async (data) => {
        const { message, user_id } = data;
        const timestamp = new Date();

        try {

            const notifications = [];
            for (const userId of user_id) {
                const newNotification = await pool.query(
                    'INSERT INTO notifications (user_id, message, created_at, is_read) VALUES ($1, $2, $3, $4) RETURNING *',
                    [userId, message, timestamp, false]
                );
                notifications.push(newNotification.rows[0]);
            }

            // Emit the notification to the specified users
            user_id.forEach(userId => {
                io.to(userId).emit('notify', { message, timestamp });
            });
        } catch (err) {
            console.error(`Error sending notification: ${err.message}`);
            socket.emit('error', { error: err.message });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });

});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});
