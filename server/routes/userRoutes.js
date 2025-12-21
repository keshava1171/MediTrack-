const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `user-${req.user ? req.user.id : 'unknown'}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|webp|svg|bmp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(null, true);
    }
});

router.put('/profile', protect, async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id;
        const user = await User.findById(userId);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            if (req.body.mobile) {
                user.mobile = req.body.mobile;
            }
            if (req.body.address) {
                user.address = req.body.address;
            }

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                mobile: updatedUser.mobile,
                address: updatedUser.address,
                patientId: updatedUser.patientId,
                role: updatedUser.role,
                photoUrl: updatedUser.photoUrl
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (err) {
        console.error('Profile update error:', err);
        next(err);
    }
});

const {
    deleteUser,
    updateUserByAdmin,
    getUserById
} = require('../controllers/authController');

router.get('/:id', protect, getUserById);

router.delete('/:id', protect, async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(401).json({ message: 'Not authorized as admin' });
    }
    await deleteUser(req, res);
});

router.put('/:id', protect, async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(401).json({ message: 'Not authorized as admin' });
    }
    await updateUserByAdmin(req, res);
});

module.exports = router;
