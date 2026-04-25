import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import {
  initDb,
  mapNotificationRow,
  mapRideRequestRow,
  mapRideRow,
  mapUserRow,
  pool,
} from "./db.js";

const app = express();
const PORT = process.env.PORT || 4000;
const emailRegex = /^[^\s@]+@matamoros\.tecnm\.mx$/i;
const PASSWORD_SALT_ROUNDS = 10;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

await initDb();

app.use(cors());
app.use(express.json());

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const toInt = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
};

const createNotification = async ({
  userId,
  type = "info",
  text,
  meta = {},
}) => {
  if (!userId || !text) return;

  await pool.query(
    `INSERT INTO notifications (user_id, type, text, meta)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [userId, type, text, JSON.stringify(meta)],
  );
};

const fetchRideById = async (id) => {
  const result = await pool.query(
    `SELECT r.*, u.name AS driver_name, u.avatar AS driver_avatar, u.car_model AS driver_car_model, u.car_plate AS driver_car_plate
     FROM rides r
     JOIN users u ON u.id = r.driver_id
     WHERE r.id = $1`,
    [id],
  );

  return result.rows[0] || null;
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "API de RIOFRIO activa" });
});

app.post("/api/cloudinary/signature", (req, res) => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({
        message:
          "Falta configurar CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY o CLOUDINARY_API_SECRET en el backend.",
      });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = String(req.body?.folder || "synroute/vehiculos").trim();
    const paramsToSign = { timestamp, folder };
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret,
    );

    return res.json({
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "No se pudo generar firma Cloudinary." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password || "";

    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "Correo institucional inválido." });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const row = result.rows[0];

    if (!row) {
      return res.status(401).json({ message: "Credenciales incorrectas." });
    }

    const storedPassword = row.password || "";
    const looksHashed = /^\$2[abxy]?\$\d{2}\$/.test(storedPassword);

    let isValidPassword = false;

    if (looksHashed) {
      isValidPassword = await bcrypt.compare(password, storedPassword);
    } else {
      // Compatibilidad temporal para cuentas antiguas guardadas en texto plano.
      isValidPassword = storedPassword === password;
      if (isValidPassword) {
        const upgradedHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
          upgradedHash,
          row.id,
        ]);
      }
    }

    if (!isValidPassword) {
      return res.status(401).json({ message: "Credenciales incorrectas." });
    }

    return res.json({ user: mapUserRow(row) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const name = (req.body?.name || "").trim();
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password || "";
    const role = String(req.body?.role || "")
      .trim()
      .toLowerCase();

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Nombre, correo y contraseña son obligatorios." });
    }

    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "Solo se permite @matamoros.tecnm.mx" });
    }

    if (role !== "passenger" && role !== "driver") {
      return res.status(400).json({
        message:
          "Debes seleccionar un rol válido para registrarte: passenger o driver.",
      });
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

    const exists = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (exists.rows[0]) {
      return res
        .status(409)
        .json({ message: "Este correo ya está registrado." });
    }

    const inserted = await pool.query(
      `INSERT INTO users (name, email, password, role, has_been_driver, avatar, is_admin, onboarding_complete)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE, FALSE)
       RETURNING *`,
      [
        name,
        email,
        passwordHash,
        role,
        role === "driver",
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      ],
    );

    return res.status(201).json({ user: mapUserRow(inserted.rows[0]) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.get("/api/users", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY id DESC");
    return res.json({ users: result.rows.map(mapUserRow) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const currentResult = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [id],
    );
    const current = currentResult.rows[0];

    if (!current) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const email = normalizeEmail(req.body?.email || current.email);

    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "Correo institucional inválido." });
    }

    const duplicated = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id <> $2",
      [email, id],
    );

    if (duplicated.rows[0]) {
      return res
        .status(409)
        .json({ message: "El correo ya existe en otro usuario." });
    }

    const role = req.body?.role === "driver" ? "driver" : "passenger";
    const next = {
      name: (req.body?.name || current.name).trim(),
      email,
      role,
      hasBeenDriver:
        role === "driver" ||
        Boolean(current.has_been_driver) ||
        current.role === "driver",
      isAdmin:
        typeof req.body?.isAdmin === "boolean"
          ? req.body.isAdmin
          : Boolean(current.is_admin),
      avatar: (req.body?.avatar ?? current.avatar ?? "").trim(),
      onboardingComplete:
        typeof req.body?.onboardingComplete === "boolean"
          ? req.body.onboardingComplete
          : Boolean(current.onboarding_complete),
      controlNumber: (
        req.body?.controlNumber ??
        current.control_number ??
        ""
      ).trim(),
      career: (req.body?.career ?? current.career ?? "").trim(),
    };

    const updated = await pool.query(
      `UPDATE users
       SET name = $1, email = $2, role = $3, has_been_driver = $4, is_admin = $5, avatar = $6, onboarding_complete = $7, control_number = $8, career = $9
       WHERE id = $10
       RETURNING *`,
      [
        next.name,
        next.email,
        next.role,
        next.hasBeenDriver,
        next.isAdmin,
        next.avatar,
        next.onboardingComplete,
        next.controlNumber,
        next.career,
        id,
      ],
    );

    return res.json({ user: mapUserRow(updated.rows[0]) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);

    if (!result.rowCount) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.put("/api/users/:id/onboarding", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const currentResult = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [id],
    );
    const current = currentResult.rows[0];

    if (!current) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const controlNumber = (req.body?.controlNumber || "").trim();
    const career = (req.body?.career || "").trim();
    const car = req.body?.car || {};
    const vehiclePhotos = Array.isArray(req.body?.vehiclePhotos)
      ? req.body.vehiclePhotos
      : [];

    const updated = await pool.query(
      `UPDATE users
       SET control_number = $1,
           career = $2,
           onboarding_complete = TRUE,
           car_model = $3,
           car_color = $4,
           car_plate = $5,
           car_capacity = $6,
           vehicle_photos = $7::jsonb
       WHERE id = $8
       RETURNING *`,
      [
        controlNumber,
        career,
        car.model || "",
        car.color || "",
        car.plate || "",
        Number(car.capacity || 0),
        JSON.stringify(vehiclePhotos),
        id,
      ],
    );

    return res.json({ user: mapUserRow(updated.rows[0]) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.get("/api/rides", async (req, res) => {
  try {
    const role = String(req.query.role || "").toLowerCase();
    const userId = toInt(req.query.userId);

    const values = [];
    const where = [];

    if (role === "driver" && userId > 0) {
      values.push(userId);
      where.push(`r.driver_id = $${values.length}`);
    } else {
      where.push("r.status = 'active'");
      where.push("r.available_seats > 0");
      if (userId > 0) {
        values.push(userId);
        where.push(`r.driver_id <> $${values.length}`);
      }
    }

    const query = `
      SELECT r.*, u.name AS driver_name, u.avatar AS driver_avatar, u.car_model AS driver_car_model, u.car_plate AS driver_car_plate
      FROM rides r
      JOIN users u ON u.id = r.driver_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY r.created_at DESC
    `;

    const result = await pool.query(query, values);
    return res.json({ rides: result.rows.map(mapRideRow) });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "No se pudieron obtener los viajes." });
  }
});

app.post("/api/rides", async (req, res) => {
  try {
    const driverId = toInt(req.body?.driverId);
    const origin = req.body?.origin || {};
    const destination = req.body?.destination || {};
    const days = Array.isArray(req.body?.days) ? req.body.days : [];
    const time = String(req.body?.time || "").trim();
    const totalSeats = toInt(req.body?.seats, 0);
    const price = toInt(req.body?.price, 0);

    if (
      driverId <= 0 ||
      !origin.name ||
      !destination.name ||
      !time ||
      totalSeats <= 0 ||
      price < 0
    ) {
      return res
        .status(400)
        .json({ message: "Datos inválidos para publicar viaje." });
    }

    const driverResult = await pool.query(
      "SELECT id, role FROM users WHERE id = $1",
      [driverId],
    );
    const driver = driverResult.rows[0];
    if (!driver) {
      return res.status(404).json({ message: "Conductor no encontrado." });
    }
    if (driver.role !== "driver") {
      return res
        .status(403)
        .json({ message: "Solo conductores pueden publicar viajes." });
    }

    const inserted = await pool.query(
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
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, 'active'
      ) RETURNING id`,
      [
        driverId,
        String(origin.name).trim(),
        Number(origin.lat || 0),
        Number(origin.lng || 0),
        String(destination.name).trim(),
        Number(destination.lat || 0),
        Number(destination.lng || 0),
        JSON.stringify(days),
        time,
        totalSeats,
        totalSeats,
        price,
      ],
    );

    const created = await fetchRideById(inserted.rows[0].id);
    return res.status(201).json({ ride: mapRideRow(created) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "No se pudo publicar el viaje." });
  }
});

app.put("/api/rides/:id", async (req, res) => {
  try {
    const rideId = toInt(req.params.id);
    const driverId = toInt(req.body?.driverId);
    const origin = req.body?.origin || {};
    const destination = req.body?.destination || {};
    const days = Array.isArray(req.body?.days) ? req.body.days : [];
    const time = String(req.body?.time || "").trim();
    const totalSeats = toInt(req.body?.seats, 0);
    const price = toInt(req.body?.price, 0);

    const current = await pool.query("SELECT * FROM rides WHERE id = $1", [
      rideId,
    ]);
    const row = current.rows[0];
    if (!row) {
      return res.status(404).json({ message: "Viaje no encontrado." });
    }
    if (driverId <= 0 || Number(row.driver_id) !== driverId) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para editar este viaje." });
    }
    if (
      !origin.name ||
      !destination.name ||
      !time ||
      totalSeats <= 0 ||
      price < 0
    ) {
      return res
        .status(400)
        .json({ message: "Datos inválidos para actualizar viaje." });
    }

    const occupiedSeats = Math.max(
      Number(row.total_seats) - Number(row.available_seats),
      0,
    );
    const nextAvailable = Math.max(totalSeats - occupiedSeats, 0);
    const nextStatus = nextAvailable === 0 ? "full" : "active";

    await pool.query(
      `UPDATE rides
       SET origin_name = $1,
           origin_lat = $2,
           origin_lng = $3,
           destination_name = $4,
           destination_lat = $5,
           destination_lng = $6,
           days = $7::jsonb,
           time_text = $8,
           total_seats = $9,
           available_seats = $10,
           price = $11,
           status = $12,
           updated_at = NOW()
       WHERE id = $13`,
      [
        String(origin.name).trim(),
        Number(origin.lat || 0),
        Number(origin.lng || 0),
        String(destination.name).trim(),
        Number(destination.lat || 0),
        Number(destination.lng || 0),
        JSON.stringify(days),
        time,
        totalSeats,
        nextAvailable,
        price,
        nextStatus,
        rideId,
      ],
    );

    const updated = await fetchRideById(rideId);
    return res.json({ ride: mapRideRow(updated) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "No se pudo actualizar el viaje." });
  }
});

app.delete("/api/rides/:id", async (req, res) => {
  try {
    const rideId = toInt(req.params.id);
    const driverId = toInt(req.query.driverId);

    const current = await pool.query(
      "SELECT driver_id FROM rides WHERE id = $1",
      [rideId],
    );
    const row = current.rows[0];
    if (!row) {
      return res.status(404).json({ message: "Viaje no encontrado." });
    }
    if (driverId <= 0 || Number(row.driver_id) !== driverId) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para eliminar este viaje." });
    }

    await pool.query("DELETE FROM rides WHERE id = $1", [rideId]);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "No se pudo eliminar el viaje." });
  }
});

app.post("/api/rides/:id/finish", async (req, res) => {
  const client = await pool.connect();

  try {
    const rideId = toInt(req.params.id);
    const driverId = toInt(req.body?.driverId);
    const ratingsPayload = Array.isArray(req.body?.ratings)
      ? req.body.ratings
      : [];

    await client.query("BEGIN");

    const current = await client.query(
      "SELECT * FROM rides WHERE id = $1 FOR UPDATE",
      [rideId],
    );
    const ride = current.rows[0];
    if (!ride) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Viaje no encontrado." });
    }
    if (driverId <= 0 || Number(ride.driver_id) !== driverId) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ message: "No tienes permisos para finalizar este viaje." });
    }
    if (ride.status === "completed") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Este viaje ya fue finalizado." });
    }
    if (ride.status !== "active" && ride.status !== "full") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Solo puedes finalizar viajes activos o llenos.",
      });
    }

    const acceptedResult = await client.query(
      `SELECT passenger_id
       FROM ride_requests
       WHERE ride_id = $1 AND status = 'accepted'
       ORDER BY passenger_id
       FOR UPDATE`,
      [rideId],
    );

    const acceptedPassengerIds = acceptedResult.rows.map((row) =>
      String(row.passenger_id),
    );

    const ratingByPassengerId = new Map(
      ratingsPayload.map((item) => [
        String(toInt(item?.passengerId)),
        toInt(item?.rating),
      ]),
    );

    const hasInvalidRating = [...ratingByPassengerId.values()].some(
      (value) => value < 1 || value > 5,
    );
    if (hasInvalidRating) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Cada calificación debe estar entre 1 y 5 estrellas.",
      });
    }

    if (acceptedPassengerIds.length > 0) {
      const hasMissingRatings = acceptedPassengerIds.some(
        (passengerId) => !ratingByPassengerId.has(passengerId),
      );
      if (hasMissingRatings) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message:
            "Debes calificar a todos los pasajeros aceptados antes de finalizar el viaje.",
        });
      }

      for (const passengerId of acceptedPassengerIds) {
        const ratingValue = ratingByPassengerId.get(passengerId);

        await client.query(
          `INSERT INTO ride_ratings (ride_id, passenger_id, driver_id, rating)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (ride_id, passenger_id, driver_id)
           DO UPDATE SET rating = EXCLUDED.rating, updated_at = NOW()`,
          [rideId, Number(passengerId), driverId, ratingValue],
        );

        await client.query(
          `INSERT INTO wallet_transactions (ride_id, driver_id, passenger_id, kind, amount)
           VALUES ($1, $2, $3, 'ride_income', $4)
           ON CONFLICT (ride_id, passenger_id, kind)
           DO NOTHING`,
          [rideId, driverId, Number(passengerId), Number(ride.price || 0)],
        );
      }
    }

    await client.query(
      "UPDATE rides SET status = 'completed', available_seats = 0, updated_at = NOW() WHERE id = $1",
      [rideId],
    );

    await client.query("COMMIT");

    return res.json({
      ok: true,
      processedPassengers: acceptedPassengerIds.length,
      incomePerPassenger: Number(ride.price || 0),
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignorado: la transacción ya no está activa.
    }
    console.error(error);
    return res.status(500).json({ message: "No se pudo finalizar el viaje." });
  } finally {
    client.release();
  }
});

app.get("/api/ride-requests", async (req, res) => {
  try {
    const driverId = toInt(req.query.driverId);
    if (driverId <= 0) {
      return res.status(400).json({ message: "driverId es obligatorio." });
    }

    const result = await pool.query(
      `SELECT rr.*, u.name AS passenger_name, u.avatar AS passenger_avatar,
              COALESCE(pr.avg_rating, 5) AS passenger_rating
       FROM ride_requests rr
       JOIN rides r ON r.id = rr.ride_id
       JOIN users u ON u.id = rr.passenger_id
       LEFT JOIN (
         SELECT passenger_id, ROUND(AVG(rating)::numeric, 1) AS avg_rating
         FROM ride_ratings
         GROUP BY passenger_id
       ) pr ON pr.passenger_id = rr.passenger_id
       WHERE r.driver_id = $1
       ORDER BY rr.created_at DESC`,
      [driverId],
    );

    return res.json({ requests: result.rows.map(mapRideRequestRow) });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "No se pudieron obtener solicitudes." });
  }
});

app.get("/api/drivers/:id/summary", async (req, res) => {
  try {
    const driverId = toInt(req.params.id);
    if (driverId <= 0) {
      return res.status(400).json({ message: "driverId inválido." });
    }

    const [balanceResult, weeklyResult, completedResult] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS balance
         FROM wallet_transactions
         WHERE driver_id = $1`,
        [driverId],
      ),
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS weekly_income
         FROM wallet_transactions
         WHERE driver_id = $1
           AND created_at >= NOW() - INTERVAL '7 days'`,
        [driverId],
      ),
      pool.query(
        `SELECT COUNT(*)::int AS completed_rides
         FROM rides
         WHERE driver_id = $1 AND status = 'completed'`,
        [driverId],
      ),
    ]);

    return res.json({
      summary: {
        balance: Number(balanceResult.rows[0]?.balance || 0),
        weeklyIncome: Number(weeklyResult.rows[0]?.weekly_income || 0),
        completedRides: Number(completedResult.rows[0]?.completed_rides || 0),
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "No se pudo obtener el resumen del conductor." });
  }
});

app.get("/api/notifications", async (req, res) => {
  try {
    const userId = toInt(req.query.userId);
    if (userId <= 0) {
      return res.status(400).json({ message: "userId es obligatorio." });
    }

    const result = await pool.query(
      `SELECT *
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId],
    );

    return res.json({ notifications: result.rows.map(mapNotificationRow) });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "No se pudieron obtener notificaciones." });
  }
});

app.put("/api/notifications/read-all", async (req, res) => {
  try {
    const userId = toInt(req.body?.userId);
    if (userId <= 0) {
      return res.status(400).json({ message: "userId es obligatorio." });
    }

    await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId],
    );

    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "No se pudieron actualizar notificaciones." });
  }
});

app.post("/api/ride-requests", async (req, res) => {
  const client = await pool.connect();

  try {
    const rideId = toInt(req.body?.rideId);
    const passengerId = toInt(req.body?.passengerId);
    const message = String(req.body?.message || "").trim();

    if (rideId <= 0 || passengerId <= 0) {
      return res
        .status(400)
        .json({ message: "rideId y passengerId son obligatorios." });
    }

    await client.query("BEGIN");

    await client.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [
      passengerId,
    ]);

    const activeRequestResult = await client.query(
      `SELECT rr.id
       FROM ride_requests rr
       JOIN rides r ON r.id = rr.ride_id
       WHERE rr.passenger_id = $1
         AND rr.ride_id <> $2
         AND rr.status IN ('pending', 'accepted')
         AND r.status IN ('active', 'full')
       LIMIT 1`,
      [passengerId, rideId],
    );

    if (activeRequestResult.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message:
          "Ya tienes una solicitud activa en otro viaje. Solo puedes pedir uno a la vez.",
      });
    }

    const rideResult = await client.query(
      "SELECT * FROM rides WHERE id = $1 FOR UPDATE",
      [rideId],
    );
    const ride = rideResult.rows[0];
    if (
      !ride ||
      ride.status !== "active" ||
      Number(ride.available_seats) <= 0
    ) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "El viaje no está disponible para solicitudes." });
    }
    if (Number(ride.driver_id) === passengerId) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "No puedes solicitar un viaje propio." });
    }

    const inserted = await client.query(
      `INSERT INTO ride_requests (ride_id, passenger_id, message)
       VALUES ($1, $2, $3)
       ON CONFLICT (ride_id, passenger_id)
       DO UPDATE SET message = EXCLUDED.message, status = 'pending'
       RETURNING *`,
      [rideId, passengerId, message],
    );

    await client.query("COMMIT");

    const passengerResult = await pool.query(
      "SELECT name, avatar FROM users WHERE id = $1",
      [passengerId],
    );
    const passenger = passengerResult.rows[0] || {};

    await createNotification({
      userId: Number(ride.driver_id),
      type: "ride_request",
      text: "Tienes una nueva solicitud para tu viaje.",
      meta: {
        rideId: String(ride.id),
        passengerId: String(passengerId),
      },
    });

    return res.status(201).json({
      request: mapRideRequestRow({
        ...inserted.rows[0],
        passenger_name: passenger.name,
        passenger_avatar: passenger.avatar,
      }),
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignorado: la transacción ya no está activa.
    }
    console.error(error);
    return res.status(500).json({ message: "No se pudo enviar la solicitud." });
  } finally {
    client.release();
  }
});

app.put("/api/ride-requests/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const requestId = toInt(req.params.id);
    const driverId = toInt(req.body?.driverId);
    const status = req.body?.status === "accepted" ? "accepted" : "rejected";

    await client.query("BEGIN");

    const current = await client.query(
      `SELECT rr.*, r.driver_id, r.available_seats, r.total_seats, r.status AS ride_status, r.origin_name, r.destination_name
       FROM ride_requests rr
       JOIN rides r ON r.id = rr.ride_id
       WHERE rr.id = $1
       FOR UPDATE`,
      [requestId],
    );
    const row = current.rows[0];
    if (!row) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Solicitud no encontrada." });
    }
    if (driverId <= 0 || Number(row.driver_id) !== driverId) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ message: "No tienes permisos para esta solicitud." });
    }

    if (row.ride_status !== "active" && row.ride_status !== "full") {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "El viaje ya no permite cambios de solicitudes." });
    }

    if (
      status === "accepted" &&
      row.status !== "accepted" &&
      Number(row.available_seats) <= 0
    ) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Ya no hay asientos disponibles en este viaje." });
    }

    await client.query("UPDATE ride_requests SET status = $1 WHERE id = $2", [
      status,
      requestId,
    ]);

    if (status === "accepted" && row.status !== "accepted") {
      const nextAvailable = Math.max(Number(row.available_seats) - 1, 0);
      const nextStatus = nextAvailable === 0 ? "full" : "active";
      await client.query(
        "UPDATE rides SET available_seats = $1, status = $2, updated_at = NOW() WHERE id = $3",
        [nextAvailable, nextStatus, row.ride_id],
      );
    }

    if (status === "rejected" && row.status === "accepted") {
      const nextAvailable = Math.min(
        Number(row.available_seats) + 1,
        Number(row.total_seats),
      );
      await client.query(
        "UPDATE rides SET available_seats = $1, status = 'active', updated_at = NOW() WHERE id = $2",
        [nextAvailable, row.ride_id],
      );
    }

    await client.query("COMMIT");

    const ridePath = `${row.origin_name} -> ${row.destination_name}`;
    if (status === "accepted") {
      await createNotification({
        userId: Number(row.passenger_id),
        type: "request_accepted",
        text: `Tu solicitud fue aceptada para el viaje ${ridePath}.`,
        meta: { rideId: String(row.ride_id), requestId: String(row.id) },
      });
    } else {
      await createNotification({
        userId: Number(row.passenger_id),
        type: "request_rejected",
        text: `Tu solicitud fue rechazada para el viaje ${ridePath}.`,
        meta: { rideId: String(row.ride_id), requestId: String(row.id) },
      });
    }

    return res.json({ ok: true });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignorado: ya no se puede revertir.
    }
    console.error(error);
    return res
      .status(500)
      .json({ message: "No se pudo actualizar la solicitud." });
  } finally {
    client.release();
  }
});

app.listen(PORT, () => {
  console.log(`Servidor API escuchando en http://localhost:${PORT}`);
});
