import bcrypt from 'bcryptjs';
import pool from './db.js';
const USERS = [
  { id:'u1', name:'Priya Ramesh',    initials:'PR', role:'admin',  email:'priya@evansville.edu' },
  { id:'u2', name:'Marcus Webb',     initials:'MW', role:'staff',  email:'marcus@evansville.edu' },
  { id:'u3', name:'Aaliyah Johnson', initials:'AJ', role:'staff',  email:'aaliyah@evansville.edu' },
  { id:'u4', name:'Jon Keller',      initials:'JK', role:'staff',  email:'jon@evansville.edu' },
  { id:'u5', name:'Dev Patel',       initials:'DP', role:'intern', email:'dev@evansville.edu' },
  { id:'u6', name:'Sofia Reyes',     initials:'SR', role:'intern', email:'sofia@evansville.edu' },
];
async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding...\n');
    const hash = await bcrypt.hash('changeme123', 10);
    for (const u of USERS) {
      const { rows } = await client.query('SELECT 1 FROM users WHERE id=$1', [u.id]);
      if (!rows.length) {
        await client.query('INSERT INTO users (id,name,initials,email,password,role) VALUES ($1,$2,$3,$4,$5,$6)',
          [u.id, u.name, u.initials, u.email, hash, u.role]);
        console.log('  created user:', u.email);
      } else {
        console.log('  skip user:', u.email);
      }
    }
    console.log('\nSeed complete. Login: priya@evansville.edu / changeme123');
  } finally { client.release(); await pool.end(); }
}
seed();
