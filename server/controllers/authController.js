const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const SystemSetting = require('../models/SystemSetting');
const logActivity = require('../utils/activityLogger');

const registerUser = async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const regSetting = await SystemSetting.findOne({ key: 'allowRegistrations' });

        if (regSetting && regSetting.value === false) {
            return res.status(503).json({ message: 'New registrations are currently disabled.' });
        }

        const { name, email, password, role, specialization } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            specialization: role === 'doctor' ? specialization : undefined
        });

        if (user) {

            logActivity(req.app.get('io'), 'New User Registered', `${user.name} (${user.role}) joined.`, 'green');

            res.status(201).json({
                _id: user._id,                 id: user.id,                   name: user.name,
                email: user.email,
                role: user.role,
                photoUrl: user.photoUrl,
                patientId: user.patientId,
                message: 'Registration successful. Please login.'
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, rememberMe } = req.body;

    try {
        const user = await User.findOne({ email }).populate('assignedDoctors', 'name specialization email photoUrl');

        const maintSetting = await SystemSetting.findOne({ key: 'maintenanceMode' });

        const isMaintenance = maintSetting ? maintSetting.value : false;

        if (isMaintenance === true) {

            if (!user || user.role !== 'admin') {
                return res.status(503).json({ message: 'System is under maintenance. Please try again later.' });
            }
        }

        if (user && (await bcrypt.compare(password, user.password))) {

            req.session.user = {
                id: user._id.toString(),
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            };

            if (rememberMe) {
                req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30;
            } else {
                req.session.cookie.expires = false;
            }

            user.isOnline = true;
            await user.save();
            const io = req.app.get('io');
            if (io) {
                io.emit('user_status_update', { userId: user.id, isOnline: true });
            }

            res.json({
                _id: user._id,                 id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                photoUrl: user.photoUrl,
                patientId: user.patientId,
                doctorId: user.doctorId,
                adminId: user.adminId,

                contact: user.contact,
                address: user.address,
                age: user.age,
                gender: user.gender,
                bloodGroup: user.bloodGroup,
                specialization: user.specialization,
                assignedDoctors: user.assignedDoctors,
                message: 'Login successful'
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const logoutUser = async (req, res) => {
    try {
        if (req.session && req.session.user) {
            const userId = req.session.user.id;

            await User.findByIdAndUpdate(userId, {
                isOnline: false,
                lastActive: new Date()
            });

            const io = req.app.get('io');
            if (io) {
                io.emit('user_status_update', {
                    userId,
                    isOnline: false,
                    lastActive: new Date()
                });
            }
        }

        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ message: 'Could not log out' });
            }
            res.clearCookie('connect.sid');
            res.json({ message: 'Logout successful' });
        });
    } catch (err) {
        console.error('Logout error:', err);

        req.session?.destroy();
        res.clearCookie('connect.sid');
        res.json({ message: 'Logout successful (with status warning)' });
    }
};

const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('assignedDoctors', 'name specialization email photoUrl');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.age = req.body.age || user.age;
            user.gender = req.body.gender || user.gender;
            user.contact = req.body.contact || req.body.mobile || user.contact;
            user.address = req.body.address || user.address;
            user.bloodGroup = req.body.bloodGroup || user.bloodGroup;
            user.photoUrl = req.body.photoUrl || user.photoUrl;

            if (req.body.medicalHistory) user.medicalHistory = req.body.medicalHistory;
            if (req.body.allergies) user.allergies = req.body.allergies;

            if (req.body.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
            }

            const updatedUser = await user.save();

            req.session.user = {
                ...req.session.user,
                name: updatedUser.name,

            };

            logActivity(req.app.get('io'), 'Profile Updated', `${updatedUser.name} updated their profile.`, 'blue');

            res.json({
                _id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                age: updatedUser.age,
                gender: updatedUser.gender,
                contact: updatedUser.contact,
                address: updatedUser.address,
                bloodGroup: updatedUser.bloodGroup,
                photoUrl: updatedUser.photoUrl,
                patientId: updatedUser.patientId,
                doctorId: updatedUser.doctorId,
                adminId: updatedUser.adminId,
                specialization: updatedUser.specialization,
                medicalHistory: updatedUser.medicalHistory,
                allergies: updatedUser.allergies,
                message: 'Profile updated successfully'
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        let query = { _id: { $ne: req.user.id } };

        if (req.user.role === 'patient') {
            const patient = await User.findById(req.user.id);

            query = {
                $and: [
                    { _id: { $ne: req.user.id } },
                    {
                        $or: [
                            { _id: { $in: patient.assignedDoctors || [] } },
                            { role: 'admin' }
                        ]
                    }
                ]
            };
        } else if (req.user.role === 'doctor') {
            const doctor = await User.findById(req.user.id);
            query = {
                $and: [
                    { _id: { $ne: req.user.id } },
                    {
                        $or: [
                            { _id: { $in: doctor.assignedPatients || [] } },                             { role: 'doctor' },                             { role: 'admin' }                           ]
                    }
                ]
            };
        }
        
        const users = await User.find(query).select('name role specialization photoUrl isOnline lastActive email');
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const HealthData = require('../models/HealthData');

const getPatients = async (req, res) => {
    try {
        let query = { role: 'patient' };
        if (req.user && req.user.role === 'doctor') {
            const userId = req.user._id || req.user.id;
            console.log('🔍 Fetching patients for doctor:', userId);

            if (!userId) {
                return res.status(401).json({ message: 'User ID missing from session' });
            }

            const doctor = await User.findById(userId);
            console.log('👨‍⚕️ Doctor record:', {
                id: doctor._id,
                name: doctor.name,
                assignedPatients: doctor.assignedPatients
            });

            query = {
                role: 'patient',
                assignedDoctors: new mongoose.Types.ObjectId(userId)
            };
            console.log('🔎 Patient query:', JSON.stringify(query));
        }

        const patients = await User.find(query).select('-password');
        console.log(`✅ Found ${patients.length} patients`);

        if (patients.length > 0) {
            console.log('📋 Patient IDs:', patients.map(p => ({ id: p._id, name: p.name, assignedDoctors: p.assignedDoctors })));
        }

        const patientsWithVitals = await Promise.all(patients.map(async (patient) => {
            const lastHeartRate = await HealthData.findOne({
                patient: patient._id,
                type: 'Heart Rate'
            }).sort({ timestamp: -1 });

            const latestRecord = await HealthData.findOne({
                patient: patient._id
            }).sort({ timestamp: -1 });

            return {
                ...patient.toObject(),
                lastVitals: {
                    heartRate: lastHeartRate ? lastHeartRate.value : '--',
                    status: latestRecord ? latestRecord.status : 'Normal',
                    lastCheck: latestRecord ? latestRecord.timestamp : null
                }
            };
        }));

        res.json(patientsWithVitals);
    } catch (err) {
        console.error('❌ Error in getPatients:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getDoctors = async (req, res) => {
    try {
        const { specialization } = req.query;
        let query = { role: 'doctor' };
        if (specialization) {
            query.specialization = specialization;
        }

        const doctors = await User.find(query).select('-password');
        res.json(doctors);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const assignDoctor = async (req, res) => {
    const { doctorId } = req.body;

    try {
        const patientId = req.user._id;

        const patient = await User.findById(patientId);
        const doctor = await User.findById(doctorId);

        if (!patient || !doctor) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (doctor.role !== 'doctor') {
            return res.status(400).json({ message: 'Selected user is not a doctor' });
        }

        if (patient.role !== 'patient') {
            return res.status(400).json({ message: 'You must be a patient to assign a doctor' });
        }

                if (patientId.toString() === doctorId.toString()) {
            return res.status(400).json({ message: 'You cannot assign yourself as your own doctor' });
        }

        const doctorObjectId = new mongoose.Types.ObjectId(doctorId);
        const patientObjectId = new mongoose.Types.ObjectId(patientId);

                const isAlreadyAssigned = (patient.assignedDoctors || []).some(id => id.toString() === doctorId.toString());

        if (isAlreadyAssigned) {
            return res.json({ message: `Doctor ${doctor.name} is already assigned to ${patient.name}` });
        }

                await User.findByIdAndUpdate(
            patientId,
            { $addToSet: { assignedDoctors: doctorObjectId } },
            { new: true }
        );

        await User.findByIdAndUpdate(
            doctorId,
            { $addToSet: { assignedPatients: patientObjectId } },
            { new: true }
        );

        console.log(`✅ Successfully assigned Doctor ${doctor.name} (${doctorId}) to Patient ${patient.name} (${patientId})`);

        const io = req.app.get('io');
        if (io) {
            io.to(patientId.toString()).emit('relationship_updated', { type: 'assign', doctorId, patientId });
            io.to(doctorId.toString()).emit('relationship_updated', { type: 'assign', doctorId, patientId });
        }

        res.json({ message: `Doctor ${doctor.name} assigned to ${patient.name}` });

    } catch (err) {
        console.error('Error in assignDoctor:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};

const unassignDoctor = async (req, res) => {
    const { doctorId } = req.body;

    try {
        const patientId = req.user._id;

        const patient = await User.findById(patientId);
        const doctor = await User.findById(doctorId);

        if (!patient || !doctor) {
            return res.status(404).json({ message: 'User not found' });
        }

        const doctorObjectId = new mongoose.Types.ObjectId(doctorId);
        const patientObjectId = new mongoose.Types.ObjectId(patientId);

                await User.findByIdAndUpdate(
            patientId,
            { $pull: { assignedDoctors: doctorObjectId } },
            { new: true }
        );

        await User.findByIdAndUpdate(
            doctorId,
            { $pull: { assignedPatients: patientObjectId } },
            { new: true }
        );

        console.log(`✅ Successfully unassigned Doctor ${doctor.name} (${doctorId}) from Patient ${patient.name} (${patientId})`);

        const io = req.app.get('io');
        if (io) {
            io.to(patientId.toString()).emit('relationship_updated', { type: 'unassign', doctorId, patientId });
            io.to(doctorId.toString()).emit('relationship_updated', { type: 'unassign', doctorId, patientId });
        }

        res.json({ message: `Doctor ${doctor.name} removed from your care team` });

    } catch (err) {
        console.error('Error in unassignDoctor:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};

const getAssignedDoctors = async (req, res) => {
    try {
        const patient = await User.findById(req.user.id).populate('assignedDoctors', '-password');
        if (!patient.assignedDoctors) {
            return res.json([]);
        }
        res.json(patient.assignedDoctors);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            const userId = user._id;

                        if (user.role === 'doctor') {
                                await User.updateMany(
                    { role: 'patient', assignedDoctors: userId },
                    { $pull: { assignedDoctors: userId } }
                );
                console.log(`🗑️  Removed doctor ${user.name} from all patient assignments`);
            } else if (user.role === 'patient') {
                                await User.updateMany(
                    { role: 'doctor', assignedPatients: userId },
                    { $pull: { assignedPatients: userId } }
                );
                console.log(`🗑️  Removed patient ${user.name} from all doctor assignments`);
            }

            await user.deleteOne();
            console.log(`✅ User ${user.name} (${user.role}) deleted successfully`);

                        const io = req.app.get('io');
            if (io) {
                io.emit('user_deleted', { userId, role: user.role, name: user.name });
                console.log(`📡 Emitted user_deleted event for ${user.name}`);
            }

            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error('❌ Error in deleteUser:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateUserByAdmin = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.role = req.body.role || user.role;

            if (req.body.specialization) user.specialization = req.body.specialization;

            if (req.body.age) user.age = req.body.age;
            if (req.body.gender) user.gender = req.body.gender;
            if (req.body.contact) user.contact = req.body.contact;
            if (req.body.address) user.address = req.body.address;
            if (req.body.bloodGroup) user.bloodGroup = req.body.bloodGroup;

            if (req.body.patientId) user.patientId = req.body.patientId;
            if (req.body.doctorId) user.doctorId = req.body.doctorId;

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                isOnline: updatedUser.isOnline
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
    updateProfile,
    getAllUsers,
    getPatients,
    getDoctors,
    assignDoctor,
    unassignDoctor,
    getAssignedDoctors,

    deleteUser,
    updateUserByAdmin,
    getUserById
};
