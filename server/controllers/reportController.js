const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const Report = require('../models/Report');
const User = require('../models/User');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const uploadReport = (req, res) => {
    if (!req.files || !req.files.file) {

        return res.status(400).json({ message: 'No file uploaded' });
    }
};

const compressAndSaveRequest = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload a file' });
    }

    const originalPath = req.file.path;
    const originalName = req.file.originalname;
    const compressedFilename = `${Date.now()}-${originalName}.gz`;
    const compressedPath = path.join(uploadDir, compressedFilename);

    const readStream = fs.createReadStream(originalPath);
    const writeStream = fs.createWriteStream(compressedPath);
    const gzip = zlib.createGzip();

    readStream.pipe(gzip).pipe(writeStream);

    writeStream.on('finish', async () => {

        fs.unlinkSync(originalPath);

        try {
            let patientName = req.body.patientName || 'Unknown';
            const patientId = req.body.patientId || (req.user.role === 'patient' ? req.user.id : null);

            if (patientId && patientName === 'Unknown') {
                const patient = await User.findById(patientId);
                if (patient) {
                    patientName = patient.name;
                }
            }

            const report = await Report.create({
                patientName: patientName,
                filename: compressedFilename,
                originalName: originalName,
                path: compressedPath,
                size: req.file.size,
                mimeType: req.file.mimetype,
                category: req.body.category || 'General',
                notes: req.body.notes || '',
                type: req.file.mimetype.startsWith('image') ? 'Image' : 'PDF',
                uploadedBy: req.user.id,
                uploadedByRole: req.user.role,
                visibility: req.body.visibility || 'Private',
                patientId: patientId
            });

            const io = req.app.get('io');
            if (io) {
                if (patientId) io.to(patientId.toString()).emit('newReport', report);

                const patientWithDocs = await User.findById(patientId).select('assignedDoctors');
                if (patientWithDocs?.assignedDoctors) {
                    patientWithDocs.assignedDoctors.forEach(docId => {
                        io.to(docId.toString()).emit('newReport', report);
                    });
                }
            }

            res.status(201).json(report);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Database error' });
        }
    });

    writeStream.on('error', (err) => {
        console.error(err);
        res.status(500).json({ message: 'Compression error' });
    });
};

const downloadReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

                const userId = req.user.id || req.user._id;
        const isOwner = report.uploadedBy.toString() === userId.toString();
        const isAdmin = req.user.role === 'admin';

        let isAssignedDoctor = false;
        if (req.user.role === 'doctor') {
            const doctor = await User.findById(userId);
            isAssignedDoctor = doctor.assignedPatients?.some(p => p.toString() === report.patientId?.toString());
        }

        if (!isOwner && !isAdmin && !isAssignedDoctor) {
            return res.status(403).json({ message: 'Not authorized to download this report' });
        }

        const readStream = fs.createReadStream(report.path);
        const gunzip = zlib.createGunzip();

        res.setHeader('X-Content-Type-Options', 'nosniff');
        const disposition = req.query.type === 'download' ? 'attachment' : 'inline';
        res.setHeader('Content-Disposition', `${disposition}; filename="${report.originalName}"`);
        res.setHeader('Content-Type', report.mimeType);

        readStream.pipe(gunzip).pipe(res);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getReports = async (req, res) => {
    try {
        let query = {};
        const { search, category } = req.query;

                if (req.user.role === 'patient') {
            query = {
                $or: [
                    { uploadedBy: req.user.id },
                    { patientId: req.user.id }
                ]
            };
        } else if (req.user.role === 'doctor') {
            const doctor = await User.findById(req.user.id);
            const assignedPatients = doctor.assignedPatients || [];

                        query = {
                $or: [
                    { uploadedBy: req.user.id },
                    { patientId: { $in: assignedPatients } }
                ]
            };
        }

        if (search) {
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { originalName: { $regex: search, $options: 'i' } },
                    { notes: { $regex: search, $options: 'i' } }
                ]
            });
        }
        if (category && category !== 'All') {
            query.category = category;
        }

        if (Object.keys(query).length === 0 && req.user.role !== 'admin') {
            return res.json([]);
        }

        const reports = await Report.find(query)
            .populate('uploadedBy', 'name role specialization doctorId patientId')
            .sort({ createdAt: -1 });

        res.json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const userId = req.user.id || req.user._id;
        const isOwner = report.uploadedBy.toString() === userId.toString();
        const isAdmin = req.user.role === 'admin';

        let isAssignedDoctor = false;
        if (req.user.role === 'doctor') {
            const doctor = await User.findById(userId);
            isAssignedDoctor = doctor.assignedPatients?.some(p => p.toString() === report.patientId?.toString());
        }

        if (!isOwner && !isAdmin && !isAssignedDoctor) {
            return res.status(403).json({ message: 'Not authorized to delete this report' });
        }

        if (fs.existsSync(report.path)) {
            try {
                fs.unlinkSync(report.path);
            } catch (e) { console.error("File delete error", e); }
        }

        await report.deleteOne();
        res.json({ message: 'Report removed' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const userId = req.user.id || req.user._id;
        const isOwner = report.uploadedBy.toString() === userId.toString();
        const isAdmin = req.user.role === 'admin';

        let isAssignedDoctor = false;
        if (req.user.role === 'doctor') {
            const doctor = await User.findById(userId);
            isAssignedDoctor = doctor.assignedPatients?.some(p => p.toString() === report.patientId?.toString());
        }

        if (!isOwner && !isAdmin && !isAssignedDoctor) {
            return res.status(403).json({ message: 'Not authorized to update this report' });
        }

        const { category, notes, visibility } = req.body;

        if (category) report.category = category;
        if (notes !== undefined) report.notes = notes;
        if (visibility) report.visibility = visibility;

        await report.save();
        res.json(report);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllAdminReports = async (req, res) => {
    try {
        const { search, status, type, role, startDate, endDate, sort } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { patientName: { $regex: search, $options: 'i' } },
                { originalName: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) query.status = status;
        if (type) query.type = type;

        if (startDate && endDate) {
            query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        let sortOption = { createdAt: -1 };
        if (sort === 'oldest') sortOption = { createdAt: 1 };
        if (sort === 'size_desc') sortOption = { size: -1 };
        if (sort === 'size_asc') sortOption = { size: 1 };

        const reports = await Report.find(query)
            .sort(sortOption)
            .populate('uploadedBy', 'name email role');

        res.json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const flagReport = async (req, res) => {
    try {
        const { reason } = req.body;
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        const isFlagging = report.status !== 'Flagged';
        report.status = isFlagging ? 'Flagged' : 'Active';
        report.flaggedReason = isFlagging ? reason : null;

        report.accessedBy.push({
            userId: req.user.id,
            role: req.user.role,
            action: isFlagging ? 'flag' : 'unflag',
            timestamp: new Date()
        });

        await report.save();
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const archiveReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        const isArchiving = report.status !== 'Archived';
        report.status = isArchiving ? 'Archived' : 'Active';
        report.archivedAt = isArchiving ? new Date() : null;

        report.accessedBy.push({
            userId: req.user.id,
            role: req.user.role,
            action: isArchiving ? 'archive' : 'unarchive',
            timestamp: new Date()
        });

        await report.save();
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getStorageStats = async (req, res) => {
    try {
        const stats = await Report.aggregate([
            {
                $group: {
                    _id: null,
                    totalSize: { $sum: "$size" },
                    count: { $sum: 1 },
                    pdfCount: { $sum: { $cond: [{ $eq: ["$type", "PDF"] }, 1, 0] } },
                    imageCount: { $sum: { $cond: [{ $eq: ["$type", "Image"] }, 1, 0] } }
                }
            }
        ]);

        const patientStats = await Report.aggregate([
            {
                $group: {
                    _id: "$patientName",
                    totalSize: { $sum: "$size" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalSize: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            global: stats[0] || { totalSize: 0, count: 0 },
            topPatients: patientStats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getReportCount = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const doctor = await User.findById(userId);
        const assignedPatients = doctor.assignedPatients || [];

        const count = await Report.countDocuments({
            $or: [
                { uploadedBy: userId },
                { patientId: { $in: assignedPatients } }
            ]
        });
        res.json({ count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
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
};
