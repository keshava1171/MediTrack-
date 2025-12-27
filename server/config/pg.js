const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT || 5432,
    connectionTimeoutMillis: 5000, 
});
const initDB = async () => {
    try {
        await pool.query('SELECT NOW()');
        const schema = fs.readFileSync(path.join(__dirname, '../models/schema.sql'), 'utf8');
        await pool.query(schema);
        console.log('PostgreSQL Schema Initialized');
    } catch (err) {
        console.error('⚠️ PostgreSQL Connection Failed: Secondary features (Admin/Reports) may not work.');
        console.error('   Reason:', err.message);
    }
};
module.exports = { pool, initDB };
