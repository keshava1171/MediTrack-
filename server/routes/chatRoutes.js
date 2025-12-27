const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({
    storage
});
router.post('/upload', upload.array('files'), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }
        const uploadedFiles = req.files.map(file => ({
            fileUrl: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
            fileName: file.originalname,
            fileSize: (file.size / 1024).toFixed(2) + ' KB',
            originalType: file.mimetype
        }));
        res.json(uploadedFiles);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});
const { getMessages } = require('../controllers/chatController');
router.get('/messages', getMessages);
module.exports = router;
