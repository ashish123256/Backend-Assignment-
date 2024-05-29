const express = require('express');
const router = express.Router();
const userController = require("../controllers/usersController.js");
const authenticateToken = require("../middleware/auth.js");


router.post('/register', userController.register);
router.post('/login',userController.login);
router.get('/profile',authenticateToken, userController.profile);

module.exports = router;