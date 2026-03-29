// Debug database connection
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('Environment Variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const { Pool } = require('pg');

const config = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT) || 5432,
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME     || 'campusassist',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

console.log('\nConnection Config:');
console.log(JSON.stringify({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password ? '***' : 'EMPTY',
  database: config.database,
}, null, 2));

const pool = new Pool(config);

pool.query('SELECT current_database() AS db')
  .then(result => {
    console.log('✅ Connection successful!');
    console.log('Database:', result.rows[0]);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });
