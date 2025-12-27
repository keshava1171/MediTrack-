const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const {
    compressAndSaveRequest,
    downloadReport,
    getReports,
    deleteReport,
    getAllAdminReports,
    flagReport,
    archiveReport,
    getStorageStats,
    updateReport,
    getReportCount
} = require('../controllers/reportController');
const upload = multer({ dest: 'temp_uploads/' });
router.post('/', protect, upload.single('file'), compressAndSaveRequest);
router.get('/', protect, getReports);
router.get('/:id/download', protect, downloadReport);
router.get('/:id/download', protect, downloadReport);
router.delete('/:id', protect, deleteReport);
router.put('/:id', protect, updateReport);
router.get('/admin/all', protect, getAllAdminReports);
router.get('/admin/stats', protect, getStorageStats);
router.get('/count', protect, getReportCount);
router.patch('/admin/:id/flag', protect, flagReport);
router.patch('/admin/:id/archive', protect, archiveReport);
module.exports = router;
