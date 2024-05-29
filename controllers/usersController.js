const pool  = require('../models/db.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


// Register a new user
exports.register = async(req,res)=>{
    const {username, password, email} = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password,10);
        const newUser = await pool.query(
            'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING *',
            [username, hashedPassword, email]
        );

        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        if(err.code === '23505'){
            res.status(400).json({message: 'Username already exists.'});
        }else{
            res.status(500).json({err:err.message})
        }
    }
}

// Authenticate a user
exports.login = async (req, res)=>{

    const {username, password} = req.body;

    try {
        const user = await pool.query('SELECT * FROM users WHERE username = $1',[username]);

        if(user.rows.length ===0) return res.status(400).json({message:"User not found"});

        const validPassword = await bcrypt.compare(password,user.rows[0].password);

        if(!validPassword) return res.status(400).json({message:"Invalid credentials"});

        const token = jwt.sign({id:user.rows[0].id, role:user.rows[0].role},process.env.JWT_SECRET);
       
        res.status(200).json({token, user: user.rows[0]});

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

//GET the profile of the logged-in user
exports.profile = async (req, res)=>{
    try {
        const user = await pool.query('SELECT id, username, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
        res.status(200).json(user.rows[0])
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}



