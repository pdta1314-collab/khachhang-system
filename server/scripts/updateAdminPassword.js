// Script to update admin password in database
// Run with: node server/scripts/updateAdminPassword.js

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/khachhang'
});

async function updateAdminPassword() {
  try {
    const newPassword = 'lumi2012grade';
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    
    console.log('Updating admin password...');
    console.log('New password:', newPassword);
    console.log('Hashed password:', hashedPassword);
    
    const result = await pool.query(
      'UPDATE admin_users SET password = $1 WHERE username = $2 RETURNING *',
      [hashedPassword, 'admin']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Password updated successfully for admin:', result.rows[0].username);
    } else {
      console.log('❌ Admin user not found');
    }
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error updating password:', err.message);
    await pool.end();
    process.exit(1);
  }
}

updateAdminPassword();
