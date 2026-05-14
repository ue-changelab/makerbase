CREATE TABLE IF NOT EXISTS storage_orgs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#4a7c59',
  zone_label TEXT
);

CREATE TABLE IF NOT EXISTS storage_items (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES storage_orgs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  zone TEXT,
  shelf_position TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('excellent','good','fair','poor')),
  flagged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS storage_checkouts (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES storage_items(id) ON DELETE CASCADE,
  borrowed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  borrower_name TEXT NOT NULL,
  event_name TEXT,
  checked_out_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_return TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_storage_items_org ON storage_items(org_id);
CREATE INDEX IF NOT EXISTS idx_storage_items_flagged ON storage_items(flagged);
CREATE INDEX IF NOT EXISTS idx_storage_checkouts_item ON storage_checkouts(item_id);
CREATE INDEX IF NOT EXISTS idx_storage_checkouts_open ON storage_checkouts(item_id) WHERE returned_at IS NULL;

-- Seed orgs
INSERT INTO storage_orgs (name, color, zone_label) VALUES
  ('EPN',                         '#27ae60', 'Section 3 + Wire Rack 1'),
  ('ChangeLab',                   '#2d4a3e', 'Section 4 + Wire Rack 2'),
  ('Toyota Driving Possibilities','#e74c3c', 'Section 5 + Wire Rack 2'),
  ('HS Changemaker Challenge',    '#3498db', 'Wire Rack 1'),
  ('Dance Camp',                  '#9b59b6', 'Door Corner'),
  ('Office Essentials',           '#7f8c8d', 'Sections 1 & 2'),
  ('Decorations',                 '#e67e22', 'Back Wall'),
  ('Shared Event Supplies',       '#1abc9c', 'Back Wall'),
  ('Miscellaneous',               '#95a5a6', 'Back Wall')
ON CONFLICT (name) DO NOTHING;

-- Seed items (27 real items from inventory)
INSERT INTO storage_items (org_id, name, description, zone, shelf_position, quantity, condition) VALUES
  ((SELECT id FROM storage_orgs WHERE name='EPN'),   'EPN backdrop',              'Long black bag',  'Wire Rack 1','Top shelf',       1,   'good'),
  ((SELECT id FROM storage_orgs WHERE name='ChangeLab'), 'Newslab pens',          '',                'Wire Rack 1','2nd from top',    300, 'good'),
  ((SELECT id FROM storage_orgs WHERE name='HS Changemaker Challenge'), 'Colored pencil packs (4pc)', '', 'Wire Rack 1','2nd from top', 197, 'good'),
  ((SELECT id FROM storage_orgs WHERE name='HS Changemaker Challenge'), 'HSCC coloring books', '',   'Wire Rack 1','2nd from top',    180, 'good'),
  ((SELECT id FROM storage_orgs WHERE name='HS Changemaker Challenge'), 'HSCC lanyards', '',         'Wire Rack 1','2nd from top',    64,  'good'),
  ((SELECT id FROM storage_orgs WHERE name='HS Changemaker Challenge'), 'HSCC stress lightbulbs', '','Wire Rack 1','2nd from top',    24,  'good'),
  ((SELECT id FROM storage_orgs WHERE name='HS Changemaker Challenge'), 'HSCC coffee tumblers', '',  'Wire Rack 1','2nd from top',    7,   'good'),
  ((SELECT id FROM storage_orgs WHERE name='HS Changemaker Challenge'), 'HSCC scarves', '',          'Wire Rack 1','2nd from top',    20,  'good'),
  ((SELECT id FROM storage_orgs WHERE name='HS Changemaker Challenge'), 'HSCC flashlights', '2 boxes','Wire Rack 1','Top shelf',      33,  'good'),
  ((SELECT id FROM storage_orgs WHERE name='HS Changemaker Challenge'), 'HSCC cups', '',             'Wire Rack 1','Bottom shelf',    234, 'good'),
  ((SELECT id FROM storage_orgs WHERE name='HS Changemaker Challenge'), 'HSCC sunglasses', '',       'Wire Rack 1','Bottom shelf',    40,  'good'),
  ((SELECT id FROM storage_orgs WHERE name='ChangeLab'), 'ChangeLab lanyards',    '',                'Wire Rack 1','2nd shelf',       40,  'good'),
  ((SELECT id FROM storage_orgs WHERE name='Office Essentials'), 'CIC paper bags','',                'Wire Rack 1','Bottom shelf',    250, 'good'),
  ((SELECT id FROM storage_orgs WHERE name='EPN'),   'EPN table centerpieces',    '',                'Wire Rack 1','Top shelf',       7,   'good'),
  ((SELECT id FROM storage_orgs WHERE name='EPN'),   'EPN brochures',             '',                'Wire Rack 1','Top shelf',       190, 'good'),
  ((SELECT id FROM storage_orgs WHERE name='EPN'),   'EPN books',                 '',                'Wire Rack 1','2nd from bottom', 23,  'good'),
  ((SELECT id FROM storage_orgs WHERE name='ChangeLab'), 'Changemaker pennants',  '',                'Wire Rack 1','3rd from top',    5,   'good'),
  ((SELECT id FROM storage_orgs WHERE name='ChangeLab'), 'CIC sticky notes',      '2 boxes',         'Wire Rack 1','2nd from top',    207, 'good'),
  ((SELECT id FROM storage_orgs WHERE name='Miscellaneous'), 'Diaper bags',        '',               'Wire Rack 2','2nd from bottom', 14,  'good'),
  ((SELECT id FROM storage_orgs WHERE name='Office Essentials'), 'Trashbags',     '6 rolls',         'Wire Rack 2','3rd from bottom', 6,   'good'),
  ((SELECT id FROM storage_orgs WHERE name='Office Essentials'), 'Lysol wipes',   '4 bottles',       'Wire Rack 2','3rd from bottom', 4,   'good'),
  ((SELECT id FROM storage_orgs WHERE name='Miscellaneous'), 'Purple dress shirts','',               'Wire Rack 2','3rd from bottom', 10,  'good'),
  ((SELECT id FROM storage_orgs WHERE name='ChangeLab'), 'iMac screens',           '',               'Wire Rack 2','3rd from bottom', 1,   'fair'),
  ((SELECT id FROM storage_orgs WHERE name='ChangeLab'), 'Adult CPR kit',          'Large boxes',    'Wire Rack 2','Bottom shelf',    40,  'good'),
  ((SELECT id FROM storage_orgs WHERE name='ChangeLab'), 'Purple event carpet runs','Long tubes',    'Wire Rack 2','2nd from top',    6,   'good'),
  ((SELECT id FROM storage_orgs WHERE name='ChangeLab'), 'Red carpet',             'Long tubes',     'Wire Rack 2','2nd from top',    2,   'good'),
  ((SELECT id FROM storage_orgs WHERE name='EPN'),   'EPN banner',                 '',               'Wire Rack 2','2nd from top',    1,   'good')
ON CONFLICT DO NOTHING;
