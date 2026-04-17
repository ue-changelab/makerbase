# MakerBase

Data management platform for the ChangeLab at the University of Evansville.

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL on Render

## Setup
cd backend && npm install
cd ../frontend && npm install
cp backend/.env.example backend/.env

## Run migrations
psql $DATABASE_URL -f migrations/001_create_users.sql
psql $DATABASE_URL -f migrations/002_create_equipment.sql
psql $DATABASE_URL -f migrations/003_create_equipment_checkouts.sql
psql $DATABASE_URL -f migrations/004_create_sessions.sql
psql $DATABASE_URL -f migrations/005_create_session_projects.sql
psql $DATABASE_URL -f migrations/006_create_certifications.sql
psql $DATABASE_URL -f migrations/007_create_user_certifications.sql
psql $DATABASE_URL -f migrations/008_create_camps.sql
psql $DATABASE_URL -f migrations/009_create_camp_participants.sql
psql $DATABASE_URL -f migrations/010_create_camp_staff.sql

## Dev servers
cd backend && npm run dev
cd frontend && npm run dev
