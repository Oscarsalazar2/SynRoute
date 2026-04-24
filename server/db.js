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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rides (
      id BIGSERIAL PRIMARY KEY,
      driver_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      origin_name TEXT NOT NULL,
      origin_lat DOUBLE PRECISION NOT NULL,
      origin_lng DOUBLE PRECISION NOT NULL,
      destination_name TEXT NOT NULL,
      destination_lat DOUBLE PRECISION NOT NULL,
      destination_lng DOUBLE PRECISION NOT NULL,
      days JSONB NOT NULL DEFAULT '[]'::jsonb,
      time_text TEXT NOT NULL,
      total_seats INTEGER NOT NULL CHECK (total_seats > 0),
      available_seats INTEGER NOT NULL CHECK (available_seats >= 0),
      price INTEGER NOT NULL CHECK (price >= 0),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'full', 'completed', 'cancelled')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ride_requests (
      id BIGSERIAL PRIMARY KEY,
      ride_id BIGINT NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
      passenger_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (ride_id, passenger_id)
    );
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

export const mapRideRow = (row) => {
  if (!row) return null;

  return {
    id: String(row.id),
    driverId: String(row.driver_id),
    driverName: row.driver_name || "",
    driverAvatar: row.driver_avatar || "",
    carModel: row.driver_car_model || "",
    plate: row.driver_car_plate || "",
    from: {
      name: row.origin_name,
      lat: Number(row.origin_lat),
      lng: Number(row.origin_lng),
    },
    to: {
      name: row.destination_name,
      lat: Number(row.destination_lat),
      lng: Number(row.destination_lng),
    },
    days: Array.isArray(row.days) ? row.days : [],
    time: row.time_text,
    availableSeats: Number(row.available_seats || 0),
    totalSeats: Number(row.total_seats || 0),
    price: Number(row.price || 0),
    status: row.status,
  };
};

export const mapRideRequestRow = (row) => {
  if (!row) return null;

  return {
    id: String(row.id),
    rideId: String(row.ride_id),
    passenger: {
      id: String(row.passenger_id),
      name: row.passenger_name || "",
      avatar: row.passenger_avatar || "",
      isVerified: true,
      rating: 5,
    },
    status: row.status,
    message: row.message || "",
  };
};
