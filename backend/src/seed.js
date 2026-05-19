import bcrypt from 'bcryptjs';
import pool from './db.js';

const USERS = [
  // ── Admins ──────────────────────────────────────────────────────────────
  { id:'u1', name:'Zeke Grant',    initials:'ZG', role:'admin', email:'zgrant4056@gmail.com' },
  { id:'u2', name:'Erin Lewis',    initials:'EL', role:'admin', email:'el131@evansville.edu' },
  { id:'u3', name:'Andrew Carter', initials:'AC', role:'admin', email:'ac116@evansville.edu' },
  { id:'u4', name:'Robert Lopez',  initials:'RL', role:'admin', email:'rl138@evansville.edu' },
  // ── Staff ────────────────────────────────────────────────────────────────
  { id:'u5', name:'Priya Ramesh',    initials:'PR', role:'staff',  email:'priya@evansville.edu' },
  { id:'u6', name:'Marcus Webb',     initials:'MW', role:'staff',  email:'marcus@evansville.edu' },
  { id:'u7', name:'Aaliyah Johnson', initials:'AJ', role:'staff',  email:'aaliyah@evansville.edu' },
  { id:'u8', name:'Jon Keller',      initials:'JK', role:'staff',  email:'jon@evansville.edu' },
  // ── Interns ──────────────────────────────────────────────────────────────
  { id:'u9',  name:'Dev Patel',   initials:'DP', role:'intern', email:'dev@evansville.edu' },
  { id:'u10', name:'Sofia Reyes', initials:'SR', role:'intern', email:'sofia@evansville.edu' },
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding users...\n');
    const hash = await bcrypt.hash('changeme123', 10);

    for (const u of USERS) {
      // Check if user exists by email (more reliable than id)
      const { rows: existing } = await client.query(
        'SELECT id, role FROM users WHERE email=$1',
        [u.email]
      );

      if (existing.length) {
        // Update role and name in case they changed
        await client.query(
          'UPDATE users SET name=$1, initials=$2, role=$3 WHERE email=$4',
          [u.name, u.initials, u.role, u.email]
        );
        console.log(`  updated: ${u.email} → role: ${u.role}`);
      } else {
        await client.query(
          'INSERT INTO users (id, name, initials, email, password, role) VALUES ($1,$2,$3,$4,$5,$6)',
          [u.id, u.name, u.initials, u.email, hash, u.role]
        );
        console.log(`  created: ${u.email} → role: ${u.role}`);
      }
    }

    console.log('\nSeed complete.');
    console.log('Default password for all users: changeme123');
    console.log('\nAdmins:');
    USERS.filter(u => u.role === 'admin').forEach(u => console.log(`  ${u.email}`));
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
