import { initDb, pool } from "./db.js";
import bcrypt from "bcryptjs";

const PASSWORD_SALT_ROUNDS = 10;

await initDb();

await pool.query(
  "TRUNCATE TABLE ride_requests, rides, users RESTART IDENTITY CASCADE",
);

const users = [
  {
    name: "Oscar Salazar",
    email: "admin@matamoros.tecnm.mx",
    password: "Admin123",
    role: "passenger",
    controlNumber: "ADM0001",
    career: "Ingeniería en Sistemas Computacionales",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    isAdmin: true,
    onboardingComplete: true,
    carModel: "",
    carColor: "",
    carPlate: "",
    carCapacity: 0,
    vehiclePhotos: [],
  },
  {
    name: "Oscar Ruiz",
    email: "l20230000@matamoros.tecnm.mx",
    password: "User123*",
    role: "passenger",
    controlNumber: "20230000",
    career: "Ingeniería Mecatrónica",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Oscar",
    isAdmin: false,
    onboardingComplete: true,
    carModel: "",
    carColor: "",
    carPlate: "",
    carCapacity: 0,
    vehiclePhotos: [],
  },
  {
    name: "Oscar Salazar",
    email: "l22260053@matamoros.tecnm.mx",
    password: "Driver123*",
    role: "driver",
    controlNumber: "22260053",
    career: "Ingeniería en Sistemas Computacionales",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=driver",
    isAdmin: false,
    onboardingComplete: true,
    carModel: "Chevrolet Aveo",
    carColor: "Plata",
    carPlate: "XHT-123-A",
    carCapacity: 4,
    vehiclePhotos: [],
  },
];

for (const user of users) {
  const passwordHash = await bcrypt.hash(user.password, PASSWORD_SALT_ROUNDS);

  await pool.query(
    `INSERT INTO users (
      name,
      email,
      password,
      role,
      control_number,
      career,
      avatar,
      is_admin,
      onboarding_complete,
      car_model,
      car_color,
      car_plate,
      car_capacity,
      vehicle_photos
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb
    )`,
    [
      user.name,
      user.email,
      passwordHash,
      user.role,
      user.controlNumber,
      user.career,
      user.avatar,
      user.isAdmin,
      user.onboardingComplete,
      user.carModel,
      user.carColor,
      user.carPlate,
      user.carCapacity,
      JSON.stringify(user.vehiclePhotos),
    ],
  );
}

const locations = {
  tec: { name: "TecNM Campus Matamoros", lat: 25.8451, lng: -97.5251 },
  plaza: { name: "Plaza Fiesta", lat: 25.8643, lng: -97.5028 },
  parque: { name: "Parque Olimpico", lat: 25.8821, lng: -97.5015 },
  soriana: { name: "Soriana Laguneta", lat: 25.8655, lng: -97.5342 },
};

const driversByEmail = await pool.query(
  "SELECT id, email, name, avatar, car_model, car_plate FROM users WHERE role = 'driver'",
);
const driver = driversByEmail.rows[0];

const passengerRows = await pool.query(
  "SELECT id FROM users WHERE role = 'passenger' AND is_admin = FALSE ORDER BY id ASC",
);
const passenger = passengerRows.rows[0];

if (driver) {
  const rideInsert = await pool.query(
    `INSERT INTO rides (
      driver_id,
      origin_name,
      origin_lat,
      origin_lng,
      destination_name,
      destination_lat,
      destination_lng,
      days,
      time_text,
      total_seats,
      available_seats,
      price,
      status
    ) VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, 'active'),
      ($1, $13, $14, $15, $16, $17, $18, $19::jsonb, $20, $21, $22, $23, 'active')
    RETURNING id`,
    [
      driver.id,
      locations.plaza.name,
      locations.plaza.lat,
      locations.plaza.lng,
      locations.tec.name,
      locations.tec.lat,
      locations.tec.lng,
      JSON.stringify(["Lu", "Mi", "Vi"]),
      "07:30",
      4,
      3,
      35,
      locations.tec.name,
      locations.tec.lat,
      locations.tec.lng,
      locations.parque.name,
      locations.parque.lat,
      locations.parque.lng,
      JSON.stringify(["Ma", "Ju"]),
      "14:15",
      3,
      2,
      40,
    ],
  );

  if (passenger && rideInsert.rows[0]) {
    await pool.query(
      `INSERT INTO ride_requests (ride_id, passenger_id, message, status)
       VALUES ($1, $2, $3, 'pending')`,
      [
        rideInsert.rows[0].id,
        passenger.id,
        "Hola, llevo mochila pequena. Gracias!",
      ],
    );
  }
}

const countResult = await pool.query(
  "SELECT COUNT(*)::int AS total FROM users",
);
const ridesCount = await pool.query("SELECT COUNT(*)::int AS total FROM rides");
console.log(
  `Seed completado. Usuarios: ${countResult.rows[0].total}. Viajes: ${ridesCount.rows[0].total}`,
);

await pool.end();
