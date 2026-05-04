ALTER TABLE dance_camp_campers 
  ADD COLUMN IF NOT EXISTS discount_code TEXT,
  ADD COLUMN IF NOT EXISTS transportation_needed TEXT;