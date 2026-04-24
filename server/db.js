import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const defaultConnectionString =
  "postgresql://postgres:postgres@localhost:5432/riofrio";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || defaultConnectionString,
});

export const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('passenger', 'driver')),
      has_been_driver BOOLEAN NOT NULL DEFAULT FALSE,
      control_number TEXT DEFAULT '',
      career TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      is_admin BOOLEAN NOT NULL DEFAULT FALSE,
      onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
      car_model TEXT DEFAULT '',
      car_color TEXT DEFAULT '',
      car_plate TEXT DEFAULT '',
      car_capacity INTEGER DEFAULT 0,
      vehicle_photos JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS has_been_driver BOOLEAN NOT NULL DEFAULT FALSE;
  `);

  await pool.query(`
    UPDATE users
    SET has_been_driver = TRUE
    WHERE role = 'driver' AND has_been_driver = FALSE;
  `);
};

export const mapUserRow = (row) => {
  if (!row) return null;

  const vehiclePhotos = Array.isArray(row.vehicle_photos)
    ? row.vehicle_photos
    : [];

  const hasDriverData =
    vehiclePhotos.length > 0 ||
    Boolean((row.car_model || "").trim()) ||
    Boolean((row.car_color || "").trim()) ||
    Boolean((row.car_plate || "").trim()) ||
    Number(row.car_capacity || 0) > 0;

  const hasBeenDriver = Boolean(row.has_been_driver);

  const user = {
    id: String(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    controlNumber: row.control_number || "",
    career: row.career || "",
    avatar: row.avatar || "",
    isAdmin: Boolean(row.is_admin),
    onboardingComplete: Boolean(row.onboarding_complete),
    canSwitchToDriver: row.role === "driver" || hasBeenDriver || hasDriverData,
    vehiclePhotos,
  };

  if (row.role === "driver") {
    user.car = {
      model: row.car_model || "",
      color: row.car_color || "",
      plate: row.car_plate || "",
      capacity: Number(row.car_capacity || 0),
    };
  }

  return user;
};
