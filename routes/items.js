const express = require('express');
const router = express.Router();
const itemsController =require('../controllers/itemsController.js');
const authenticateToken = require('../middleware/auth.js');
const multer = require('multer');

// Multer configuration for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

router.get('/',itemsController.getAllItems);
router.get('/:id', itemsController.getItemById);
router.post('/', authenticateToken,upload.single('image'), itemsController.createItem);
router.put('/:id',authenticateToken,upload.single('image'),itemsController.updateItem);
router.delete('/:id',authenticateToken,itemsController.deleteItem);
module.exports = router;