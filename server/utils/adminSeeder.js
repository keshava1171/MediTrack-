const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
    try {
        const adminEmail = 'admin@example.com';
        const adminPassword = 'admin123'; 

        const adminExists = await User.findOne({ email: adminEmail });

        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            await User.create({
                name: 'System Administrator',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin'
            });

            console.log('✅ Admin User Created');
        }

        console.log('\n==================================================');
        console.log('                 ADMIN ACCESS                     ');
        console.log('==================================================');
        console.log(` Email:    ${adminEmail}`);
        console.log(` Password: ${adminPassword}`);
        console.log(' Login at: http://localhost:5173/admin/login');
        console.log('==================================================\n');

    } catch (error) {
        console.error('❌ Admin Seeding Failed:', error.message);
    }
};

module.exports = seedAdmin;
