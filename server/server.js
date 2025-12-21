require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const User = require('./models/User');
const MongoStore = require('connect-mongo').default;
const connectMongo = require('./config/db');
const { pool, initDB } = require('./config/pg');
const Alert = require('./models/Alert');


const app = express();
const server = http.createServer(app);

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

connectMongo();

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://127.0.0.1:5173"],         methods: ["GET", "POST"],
        credentials: true
    }
});
app.set('io', io);

const simulator = require('./utils/simulator');
const seedAdmin = require('./utils/adminSeeder');

seedAdmin();

const resetUserStatus = async () => {
    try {
        await User.updateMany({}, { isOnline: false });
        console.log('✅ User statuses reset to offline');
    } catch (error) {
        console.error('❌ Failed to reset user statuses:', error);
    }
};
resetUserStatus();

simulator.startSimulation();

simulator.on('data', (data) => {
    io.emit('healthUpdate', data);
});

const mongoose = require('mongoose');
setInterval(() => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    const serverStatus = 'Online';
    const timestamp = new Date();

    io.emit('system_health', {
        server: serverStatus,
        database: dbStatus,
        timestamp: timestamp
    });
}, 10000);

simulator.on('alert', async (alert) => {
    try {
        const count = await User.countDocuments({ role: 'patient' });
        const random = Math.floor(Math.random() * count);
        const patient = await User.findOne({ role: 'patient' }).skip(random).select('name patientId email role assignedDoctors');

        if (patient) {
            const enrichedAlert = {
                ...alert,
                patient: {
                    _id: patient._id,
                    name: patient.name,
                    patientId: patient.patientId
                },
                severity: alert.message.includes('High') || alert.message.includes('Low') ? 'Critical' : 'Medium',
                timestamp: new Date()
            };

            const newAlert = new Alert({
                patient: patient._id,
                type: 'Health Alert',
                message: enrichedAlert.message,
                severity: enrichedAlert.severity,
                timestamp: enrichedAlert.timestamp
            });
            const savedAlert = await newAlert.save();

            const alertToEmit = { ...enrichedAlert, _id: savedAlert._id };

            io.to(patient._id.toString()).emit('healthAlert', alertToEmit);

            if (patient.assignedDoctors && patient.assignedDoctors.length > 0) {
                patient.assignedDoctors.forEach(doctorId => {
                    io.to(doctorId.toString()).emit('healthAlert', alertToEmit);
                });
            }
        }
    } catch (err) {
        console.error('Error enriching and saving simulated alert:', err);
    }
});

const Message = require('./models/Message');

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    let currentUserId = null;

    socket.on('user_connected', async (userId) => {
        try {
            currentUserId = userId;
            socket.join(userId);
            await User.findByIdAndUpdate(userId, { isOnline: true });
            io.emit('user_status_update', { userId, isOnline: true });
        } catch (err) {
            console.error('Error updating user status:', err);
        }
    });

    socket.on('send_message', async (data) => {
        try {
            const newMessage = new Message(data);
            const savedMessage = await newMessage.save();

            if (data.replyTo) {
                await savedMessage.populate('replyTo', 'sender content type');
            }

            const conversationParticipants = data.conversationId.split('_');
            conversationParticipants.forEach(participantId => {
                io.to(participantId).emit('receive_message', savedMessage);
            });

            const admins = await User.find({ role: 'admin' }).select('_id');
            admins.forEach(admin => {
                const adminId = admin._id.toString();
                if (!conversationParticipants.includes(adminId)) {
                    io.to(adminId).emit('receive_message', savedMessage);
                }
            });

        } catch (err) {
            console.error('Error saving message:', err);
        }
    });

    socket.on('like_message', async ({ messageId, userId, userName }) => {
        try {
            const message = await Message.findById(messageId);
            if (message) {

                const index = message.likes.indexOf(userName);
                if (index === -1) {
                    message.likes.push(userName);
                } else {
                    message.likes.splice(index, 1);
                }
                const updatedMessage = await message.save();

                if (updatedMessage.conversationId) {
                    const participants = updatedMessage.conversationId.split('_');
                    participants.forEach(pId => {
                        io.to(pId).emit('message_updated', updatedMessage);
                    });
                } else {
                                        io.to('general_chat').emit('message_updated', updatedMessage);
                }
            }
        } catch (err) {
            console.error('Error liking message:', err);
        }
    });

    socket.on('delete_message', async ({ messageId, userName }) => {
        try {
            const message = await Message.findById(messageId);
            if (message) {
                message.isDeleted = true;
                message.deletedBy = userName;
                const updatedMessage = await message.save();

                if (updatedMessage.conversationId) {
                    const participants = updatedMessage.conversationId.split('_');
                    participants.forEach(pId => {
                        io.to(pId).emit('message_updated', updatedMessage);
                    });
                } else {
                    io.to('general_chat').emit('message_updated', updatedMessage);
                }
            }
        } catch (err) {
            console.error('Error deleting message:', err);
        }
    });

    socket.on('disconnect', async () => {
        console.log('User disconnected:', socket.id);
        if (currentUserId) {
            try {
                const lastActive = new Date();
                await User.findByIdAndUpdate(currentUserId, { isOnline: false, lastActive });
                io.emit('user_status_update', { userId: currentUserId, isOnline: false, lastActive });
            } catch (err) {
                console.error('Error updating disconnect status:', err);
            }
        }
    });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/health', require('./routes/healthRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));

app.get('/', (req, res) => {
    res.send('MediTrack Pro API is running');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
