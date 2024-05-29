const Pool = require('pg').Pool;
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
    user:"postgres",
    password:"1234@",
    host:"localhost",
    port:5432,
    database:"biddingplatform"
})


module.exports = pool;