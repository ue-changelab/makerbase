import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import pool from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10*1024*1024 } });

// ── Helpers ─────────────────────────────────────────────────────────────────

function nullify(val) {
  if (val===null||val===undefined) return null;
  const s = String(val).trim();
  if (!s||['no','none','n/a','na','-','any'].includes(s.toLowerCase())) return null;
  return s;
}

function normalizeDate(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
  const patterns = [
    [/^(\d{2})-(\d{2})-(\d{4})$/, m => m[3]+'-'+m[1]+'-'+m[2]],
    [/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, m => m[3]+'-'+m[1].padStart(2,'0')+'-'+m[2].padStart(2,'0')],
    [/^(\d{1,2})\s+(\w+)\s+(\d{4})$/, m => { const mo={january:'01',february:'02',march:'03',april:'04',may:'05',june:'06',july:'07',august:'08',september:'09',october:'10',november:'11',december:'12'}; return m[3]+'-'+(mo[m[2].toLowerCase()]||'01')+'-'+m[1].padStart(2,'0'); }],
    [/^(\d{2})-(\d{2})-(\d{2})$/, m => '20'+m[3]+'-'+m[1]+'-'+m[2]],
  ];
  for (const [re,fn] of patterns) { const m=s.match(re); if(m){try{const d=fn(m);if(d&&!isNaN(new Date(d)))return d;}catch{}} }
  try{const d=new Date(s);if(!isNaN(d))return d.toISOString().slice(0,10);}catch{}
  return null;
}

function normalizeShirt(val) {
  if (!val) return null;
  const m={'xs':'XS','xs/s':'XS','s':'S','small':'S','m':'M','medium':'M','l':'L','large':'L','xl':'XL','xxl':'XXL'};
  return m[String(val).trim().toLowerCase()]??String(val).trim().toUpperCase();
}

function detectType(headers) {
  const h = headers.map(c=>String(c).toLowerCase());
  const has = (...cols) => cols.every(c=>h.some(x=>x.includes(c)));
  if (has('full name')&&has('parent')&&has('emergency contact')) return 'dance_camp';
  if (has('major')&&has('joined')) return 'members';
  if (has('serial')&&has('category')&&has('location')) return 'equipment';
  if (has('code')&&has('semester')&&has('faculty')) return 'changelabs';
  if (has('mou')&&has('contact')&&has('kind')) return 'partners';
  if (has('valid')) return 'certifications';
  return null;
}

async function canEditDanceCamp(userId, userRole, campName = 'Dance Camp 2026') {
  if (userRole === 'admin') return true;
  const { rows } = await pool.query(
    'SELECT 1 FROM dance_camp_staff WHERE camp_name=$1 AND user_id=$2',
    [campName, userId]
  );
  return rows.length > 0;
}

// ── Import handlers ──────────────────────────────────────────────────────────

async function importDanceCamp(rows, userId, client) {
  let imported=0, skipped=0; const errors=[];
  const guardianCache={};

  for (const [i,row] of rows.entries()) {
    const rn = i+2;
    try {
      const fullName = nullify(row['Full Name']);
      if (!fullName) { skipped++; continue; }

      const guardianName = nullify(row['Parent/Guardian Name']);
      let guardianId = null;
      if (guardianName) {
        if (guardianCache[guardianName]) {
          guardianId = guardianCache[guardianName];
        } else {
          const ex = await client.query('SELECT id FROM dance_camp_guardians WHERE name=$1', [guardianName]);
          if (ex.rows[0]) {
            guardianId = ex.rows[0].id;
          } else {
            const g = await client.query(
              'INSERT INTO dance_camp_guardians (name,relationship,address,city_state_zip,dob,email,cell_phone,work_phone) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
              [
                guardianName,
                nullify(row['Parent Relationship']),
                nullify(row['Parent Address']),
                nullify(row['Parent City/State/Zip']),
                normalizeDate(row['Parent DOB']),
                nullify(row['Parent Email']),
                nullify(row['Parent Cell Phone']),
                nullify(row['Parent Work Phone']),
              ]
            );
            guardianId = g.rows[0].id;
          }
          guardianCache[guardianName] = guardianId;
        }
      }

      const preferred_name        = nullify(row['Preferred Name']);
      const dob                   = normalizeDate(row['Date of Birth']);
      const age_at_camp           = parseInt(String(row['Age at Camp']||'').replace(/\D.*/,'')) || null;
      const schoolGrade           = nullify(row['School & Grade']);
      const school                = schoolGrade?.split('/')[0]?.trim() ?? null;
      const grade                 = schoolGrade?.split('/')[1]?.trim() ?? null;
      const race                  = nullify(row['Race']);
      const shirt_size            = normalizeShirt(row['Shirt Size']);
      const medical_conditions    = nullify(row['Medical Conditions/Allergies']);
      const medication_required   = nullify(row['Medication Required']);
      const food_restrictions     = nullify(row['Food Restrictions']);
      const known_medical_issues  = nullify(row['Known Medical Issues']);
      const discount_code         = nullify(row['Discount Code']);
      const transportation_needed = nullify(row['Transportation Needed']);

      const ex = await client.query(
        'SELECT id FROM dance_camp_campers WHERE full_name=$1 AND camp_name=$2',
        [fullName, 'Dance Camp 2026']
      );

      let camperId;
      if (ex.rows[0]) {
        await client.query(
          `UPDATE dance_camp_campers SET
            preferred_name=$2, dob=$3, age_at_camp=$4, school=$5, grade=$6, race=$7,
            shirt_size=$8, medical_conditions=$9, medication_required=$10,
            food_restrictions=$11, known_medical_issues=$12, guardian_id=$13,
            discount_code=$14, transportation_needed=$15
          WHERE id=$1`,
          [
            ex.rows[0].id, preferred_name, dob, age_at_camp, school, grade, race,
            shirt_size, medical_conditions, medication_required, food_restrictions,
            known_medical_issues, guardianId, discount_code, transportation_needed,
          ]
        );
        camperId = ex.rows[0].id;
      } else {
        const c = await client.query(
          `INSERT INTO dance_camp_campers
            (full_name,preferred_name,dob,age_at_camp,school,grade,race,shirt_size,
             medical_conditions,medication_required,food_restrictions,known_medical_issues,
             guardian_id,discount_code,transportation_needed)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
          [
            fullName, preferred_name, dob, age_at_camp, school, grade, race,
            shirt_size, medical_conditions, medication_required, food_restrictions,
            known_medical_issues, guardianId, discount_code, transportation_needed,
          ]
        );
        camperId = c.rows[0].id;
      }

      const ecName = nullify(row['Emergency Contact Name']);
      if (ecName) {
        const ecEx = await client.query(
          'SELECT id FROM dance_camp_emergency_contacts WHERE camper_id=$1 AND name=$2',
          [camperId, ecName]
        );
        if (!ecEx.rows[0]) {
          await client.query(
            'INSERT INTO dance_camp_emergency_contacts (camper_id,name,phone,relationship) VALUES ($1,$2,$3,$4)',
            [camperId, ecName, nullify(row['Emergency Contact Phone']), nullify(row['Emergency Contact Relationship'])]
          );
        }
      }

      imported++;
    } catch(err) {
      console.error('Row', rn, 'error:', err.message);
      errors.push({ row: rn, message: err.message });
    }
  }

  return { imported, skipped, errors };
}

async function importMembers(rows, userId, client) {
  let imported=0, skipped=0; const errors=[];
  for (const [i,row] of rows.entries()) {
    const rn = i+2;
    try {
      const name = nullify(row['Name']??row['Full Name']);
      if (!name) { skipped++; continue; }
      await client.query(
        'INSERT INTO members (name,email,major,status,joined) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',
        [name, nullify(row['Email']), nullify(row['Major']), nullify(row['Status'])??'active', normalizeDate(row['Joined'])??new Date().toISOString().slice(0,10)]
      );
      imported++;
    } catch(err) { errors.push({ row: rn, message: err.message }); }
  }
  return { imported, skipped, errors };
}

async function importEquipment(rows, userId, client) {
  let imported=0, skipped=0; const errors=[];
  for (const [i,row] of rows.entries()) {
    const rn = i+2;
    try {
      const name = nullify(row['Name']);
      if (!name) { skipped++; continue; }
      await client.query(
        'INSERT INTO equipment (name,category,status,location,serial,note) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',
        [name, nullify(row['Category'])??'Other', nullify(row['Status'])??'available', nullify(row['Location']), nullify(row['Serial']??row['Serial Number']), nullify(row['Note']??row['Notes'])]
      );
      imported++;
    } catch(err) { errors.push({ row: rn, message: err.message }); }
  }
  return { imported, skipped, errors };
}

async function importPartners(rows, userId, client) {
  let imported=0, skipped=0; const errors=[];
  const validMou = ['signed','mou_pending','informal','none'];
  for (const [i,row] of rows.entries()) {
    const rn = i+2;
    try {
      const name = nullify(row['Name']??row['Organization']);
      if (!name) { skipped++; continue; }
      const mouRaw = nullify(row['MOU Status']??row['MOU'])?.toLowerCase().replace(/\s/g,'_');
      const mou = validMou.includes(mouRaw) ? mouRaw : 'none';
      await client.query(
        'INSERT INTO partners (name,kind,contact,role,email,phone,mou_status,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING',
        [name, nullify(row['Kind']??row['Type'])??'Nonprofit', nullify(row['Contact']), nullify(row['Role']), nullify(row['Email']), nullify(row['Phone']), mou, nullify(row['Notes'])]
      );
      imported++;
    } catch(err) { errors.push({ row: rn, message: err.message }); }
  }
  return { imported, skipped, errors };
}

async function importCerts(rows, userId, client) {
  let imported=0, skipped=0; const errors=[];
  for (const [i,row] of rows.entries()) {
    const rn = i+2;
    try {
      const name = nullify(row['Name']??row['Certification']);
      if (!name) { skipped++; continue; }
      const vd = parseInt(row['Valid Days']??row['valid_days']);
      await client.query(
        'INSERT INTO certifications (name,valid_days) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [name, isNaN(vd) ? null : vd]
      );
      imported++;
    } catch(err) { errors.push({ row: rn, message: err.message }); }
  }
  return { imported, skipped, errors };
}

const importers = {
  dance_camp:     importDanceCamp,
  members:        importMembers,
  equipment:      importEquipment,
  partners:       importPartners,
  certifications: importCerts,
};

// ── Bulk import ──────────────────────────────────────────────────────────────

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded — use field name "file"' });
  const wb = XLSX.read(req.file.buffer, { type:'buffer', cellDates:false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval:null, raw:false });
  if (!rows.length) return res.status(400).json({ error: 'Sheet is empty' });
  const type = detectType(Object.keys(rows[0]));
  if (!type||!importers[type]) return res.status(400).json({ error: 'Could not detect sheet type', headers: Object.keys(rows[0]) });
  const client = await pool.connect();
  let result;
  try {
    await client.query('BEGIN');
    result = await importers[type](rows, req.user.id, client);
    await client.query('COMMIT');
  } catch(err) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: 'Import failed: ' + err.message });
  } finally {
    client.release();
  }
  await pool.query(
    'INSERT INTO import_logs (filename,sheet_type,rows_found,rows_imported,rows_skipped,errors,imported_by) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [req.file.originalname, type, rows.length, result.imported, result.skipped, result.errors.length ? JSON.stringify(result.errors) : null, req.user.id]
  ).catch(() => {});
  res.json({ type, filename: req.file.originalname, rows_found: rows.length, rows_imported: result.imported, rows_skipped: result.skipped, errors: result.errors });
});

// ── Import logs ──────────────────────────────────────────────────────────────

router.get('/logs', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT il.*, u.name AS imported_by_name FROM import_logs il LEFT JOIN users u ON u.id=il.imported_by ORDER BY il.imported_at DESC LIMIT 50'
  );
  res.json(rows);
});

// ── Roster ───────────────────────────────────────────────────────────────────

router.get('/roster/:type', requireAuth, async (req, res) => {
  const queries = {
    dance_camp:
      `SELECT c.*,
        g.name AS guardian_name, g.email AS guardian_email, g.cell_phone AS guardian_phone,
        g.relationship AS guardian_relationship, g.address AS guardian_address,
        g.city_state_zip AS guardian_city_state_zip, g.work_phone AS guardian_work_phone,
        e.name AS emergency_contact, e.phone AS ec_phone, e.relationship AS ec_relationship,
        e.id AS ec_id
       FROM dance_camp_campers c
       LEFT JOIN dance_camp_guardians g ON g.id=c.guardian_id
       LEFT JOIN dance_camp_emergency_contacts e ON e.camper_id=c.id
       ORDER BY c.school NULLS LAST, c.full_name`,
    members:        'SELECT * FROM members ORDER BY name',
    equipment:      'SELECT e.*,u.name AS out_to_name FROM equipment e LEFT JOIN users u ON u.id=e.out_to ORDER BY e.category,e.name',
    partners:       'SELECT * FROM partners ORDER BY name',
    certifications: 'SELECT * FROM certifications ORDER BY name',
  };
  const q = queries[req.params.type];
  if (!q) return res.status(400).json({ error: 'Unknown type' });
  const { rows } = await pool.query(q);
  res.json(rows);
});

// ── Dance camp staff — must come BEFORE /:id routes ─────────────────────────

router.get('/dance-camp/staff', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.initials, u.email, u.role
     FROM dance_camp_staff dcs
     JOIN users u ON u.id=dcs.user_id
     WHERE dcs.camp_name='Dance Camp 2026'
     ORDER BY u.name`
  );
  res.json(rows);
});

router.post('/dance-camp/staff', requireAdmin, async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });
  await pool.query(
    `INSERT INTO dance_camp_staff (camp_name, user_id) VALUES ('Dance Camp 2026', $1) ON CONFLICT DO NOTHING`,
    [user_id]
  );
  res.json({ ok: true });
});

router.delete('/dance-camp/staff/:userId', requireAdmin, async (req, res) => {
  await pool.query(
    `DELETE FROM dance_camp_staff WHERE camp_name='Dance Camp 2026' AND user_id=$1`,
    [req.params.userId]
  );
  res.json({ ok: true });
});

// ── Dance camp status (quick) ────────────────────────────────────────────────

router.patch('/dance-camp/:id', requireAuth, async (req, res) => {
  const { status } = req.body;
  if (!['applied','confirmed','waitlist','cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const allowed = await canEditDanceCamp(req.user.id, req.user.role);
  if (!allowed) return res.status(403).json({ error: 'Not authorized to edit this camp' });
  const { rows } = await pool.query(
    'UPDATE dance_camp_campers SET status=$1 WHERE id=$2 RETURNING *',
    [status, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// ── Dance camp full edit ─────────────────────────────────────────────────────

router.patch('/dance-camp/:id/full', requireAuth, async (req, res) => {
  const allowed = await canEditDanceCamp(req.user.id, req.user.role);
  if (!allowed) return res.status(403).json({ error: 'Not authorized to edit this camp' });

  const isAdmin = req.user.role === 'admin';
  const {
    // Staff-editable
    preferred_name, school, grade, shirt_size, transportation_needed, status,
    medical_conditions, medication_required, food_restrictions, known_medical_issues,
    // Guardian
    guardian_name, guardian_relationship, guardian_address, guardian_city_state_zip,
    guardian_email, guardian_phone, guardian_work_phone,
    // Emergency contact
    ec_name, ec_phone, ec_relationship,
    // Admin-only
    full_name, dob, age_at_camp, race, discount_code,
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (isAdmin) {
      await client.query(
        `UPDATE dance_camp_campers SET
          full_name=$2, preferred_name=$3, dob=$4, age_at_camp=$5,
          school=$6, grade=$7, race=$8, shirt_size=$9,
          medical_conditions=$10, medication_required=$11, food_restrictions=$12,
          known_medical_issues=$13, discount_code=$14, transportation_needed=$15, status=$16
        WHERE id=$1`,
        [
          req.params.id,
          full_name ?? null, preferred_name ?? null, normalizeDate(dob), age_at_camp ?? null,
          school ?? null, grade ?? null, race ?? null, normalizeShirt(shirt_size),
          medical_conditions ?? null, medication_required ?? null, food_restrictions ?? null,
          known_medical_issues ?? null, discount_code ?? null, transportation_needed ?? null, status ?? null,
        ]
      );
    } else {
      await client.query(
        `UPDATE dance_camp_campers SET
          preferred_name=$2, school=$3, grade=$4, shirt_size=$5,
          medical_conditions=$6, medication_required=$7, food_restrictions=$8,
          known_medical_issues=$9, transportation_needed=$10, status=$11
        WHERE id=$1`,
        [
          req.params.id,
          preferred_name ?? null, school ?? null, grade ?? null, normalizeShirt(shirt_size),
          medical_conditions ?? null, medication_required ?? null, food_restrictions ?? null,
          known_medical_issues ?? null, transportation_needed ?? null, status ?? null,
        ]
      );
    }

    // Guardian update/create
    const { rows: camperRows } = await client.query(
      'SELECT guardian_id FROM dance_camp_campers WHERE id=$1',
      [req.params.id]
    );
    const guardianId = camperRows[0]?.guardian_id;

    if (guardian_name) {
      if (guardianId) {
        await client.query(
          `UPDATE dance_camp_guardians SET
            name=$2, relationship=$3, address=$4, city_state_zip=$5,
            email=$6, cell_phone=$7, work_phone=$8
          WHERE id=$1`,
          [
            guardianId, guardian_name, guardian_relationship ?? null,
            guardian_address ?? null, guardian_city_state_zip ?? null,
            guardian_email ?? null, guardian_phone ?? null, guardian_work_phone ?? null,
          ]
        );
      } else {
        const g = await client.query(
          `INSERT INTO dance_camp_guardians (name,relationship,address,city_state_zip,email,cell_phone,work_phone)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
          [
            guardian_name, guardian_relationship ?? null, guardian_address ?? null,
            guardian_city_state_zip ?? null, guardian_email ?? null,
            guardian_phone ?? null, guardian_work_phone ?? null,
          ]
        );
        await client.query(
          'UPDATE dance_camp_campers SET guardian_id=$1 WHERE id=$2',
          [g.rows[0].id, req.params.id]
        );
      }
    }

    // Emergency contact update/create
    if (ec_name) {
      const { rows: ecRows } = await client.query(
        'SELECT id FROM dance_camp_emergency_contacts WHERE camper_id=$1 LIMIT 1',
        [req.params.id]
      );
      if (ecRows[0]) {
        await client.query(
          'UPDATE dance_camp_emergency_contacts SET name=$2, phone=$3, relationship=$4 WHERE id=$1',
          [ecRows[0].id, ec_name, ec_phone ?? null, ec_relationship ?? null]
        );
      } else {
        await client.query(
          'INSERT INTO dance_camp_emergency_contacts (camper_id,name,phone,relationship) VALUES ($1,$2,$3,$4)',
          [req.params.id, ec_name, ec_phone ?? null, ec_relationship ?? null]
        );
      }
    }

    await client.query('COMMIT');

    // Return full updated record
    const { rows } = await pool.query(
      `SELECT c.*,
        g.name AS guardian_name, g.email AS guardian_email, g.cell_phone AS guardian_phone,
        g.relationship AS guardian_relationship, g.address AS guardian_address,
        g.city_state_zip AS guardian_city_state_zip, g.work_phone AS guardian_work_phone,
        e.name AS emergency_contact, e.phone AS ec_phone, e.relationship AS ec_relationship,
        e.id AS ec_id
       FROM dance_camp_campers c
       LEFT JOIN dance_camp_guardians g ON g.id=c.guardian_id
       LEFT JOIN dance_camp_emergency_contacts e ON e.camper_id=c.id
       WHERE c.id=$1`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch(err) {
    await client.query('ROLLBACK');
    console.error('Full camper update failed:', err.message);
    res.status(500).json({ error: 'Update failed: ' + err.message });
  } finally {
    client.release();
  }
});

export default router;
