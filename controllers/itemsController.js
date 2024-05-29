const pool = require('../models/db.js');

// Retrieve all auction items with pagination
exports.getAllItems = async(req, res)=>{
    const {page= 1 , limit=10} = req.query;
    const offset = (page - 1) * limit;

    try {
        const items = await pool.query('SELECT * FROM items LIMIT $1 OFFSET $2',[limit,offset]);
        res.status(200).json(items.rows[0]);
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Retrieve a single auction item by ID

exports.getItemById = async(req, res)=>{
    const {id} = req.params;

    try {
        const item = await pool.query('SELECT * FROM items WHERE id = $1', [id]);

        if (item.rows.length === 0) return res.status(404).json({ message: 'Item not found' });

        res.status(200).json(item.rows[0]);
    } catch (error) {
        res.status(500).json({ error: err.message });
    }

}

//Create a new auction item
exports.createItem = async(req, res)=>{
    const {name, description, starting_price,current_price, image_url, end_time} = req.body;

    try {
        const newItem = await pool.query(
            'INSERT INTO items (name, description, starting_price, current_price, image_url, end_time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',[name,description,starting_price, current_price,image_url,end_time]
        );
        res.status(201).json(newItem.rows[0])
    } catch (error) {
        res.status(500).json({ error: err.message });
    }
}


// Update an auction item by ID
exports.updateItem = async(req, res)=>{
    const {id} = req.params;
    const { name, description, starting_price, current_price, image_url, end_time } = req.body;

    try {
        const updatedItem = await pool.query(
            'UPDATE items SET name = $1, description = $2, starting_price = $3, current_price = $4, image_url = $5, end_time = $6 WHERE id = $7 RETURNING *',
            [name, description, starting_price, current_price, image_url, end_time, id]
        );
        if(updatedItem.rows.length === 0) return res.status(404).json({message:"Item not found"});

        res.status(204).json(updatedItem.rows[0]);
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
}

// Delete an auction item by ID
exports.deleteItem = async(req, res)=>{
    const {id} = req.params;

    try {
        const deletedItem = await pool.query('DELETE FROM items WHERE id = $1 RETURNING *', [id]);
        if (deletedItem.rows.length === 0) return res.status(404).json({ message: 'Item not found' });
        res.status(200).json({message:"Deleted Successfully",deletedItem});
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}