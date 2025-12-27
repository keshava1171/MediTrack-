const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const {
    registerUser, loginUser, logoutUser, getMe, updateProfile, getAllUsers,
    getPatients, getDoctors, assignDoctor, unassignDoctor, getAssignedDoctors
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
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
const registerValidation = [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    check('role')
        .isIn(['patient', 'doctor'])
        .withMessage('Role must be either patient or doctor'),
];
const loginValidation = [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
];
router.post('/register', registerValidation, registerUser);
router.post('/login', loginValidation, loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/profile-photo', protect, upload.single('photo'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        const userId = req.user.id || req.user._id;
        const user = await User.findById(userId);
        if (user) {
            user.photoUrl = fileUrl;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                mobile: updatedUser.mobile,
                role: updatedUser.role,
                photoUrl: updatedUser.photoUrl
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (err) {
        console.error('Error in profile-photo route:', err);
        next(err);
    }
});
router.get('/users', protect, getAllUsers);
router.get('/patients', protect, getPatients);
router.get('/doctors', protect, getDoctors);
router.post('/assign-doctor', protect, assignDoctor);
router.post('/assign_doctor', protect, assignDoctor);
router.post('/unassign-doctor', protect, unassignDoctor);
router.post('/unassign_doctor', protect, unassignDoctor);
router.get('/my-doctors', protect, getAssignedDoctors);
module.exports = router;
